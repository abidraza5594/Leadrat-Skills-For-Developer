import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'fs-extra';
import { glob } from 'glob';
import { Node, Project, Scope, SyntaxKind, } from 'ts-morph';
import { IGNORED_GLOBS, SOURCE_SCAN_GLOBS, TS_SCAN_GLOBS, } from '../core/constants.js';
export class AngularProjectScanner {
    repoRoot;
    constructor(repoRoot) {
        this.repoRoot = repoRoot;
    }
    async scan() {
        const tsFiles = await this.findTsFiles();
        const project = new Project({
            tsConfigFilePath: await this.resolveTsConfig(),
            skipAddingFilesFromTsConfig: true,
        });
        project.addSourceFilesAtPaths(tsFiles.map((file) => path.join(this.repoRoot, file)));
        const sourceFiles = project.getSourceFiles();
        const packageJson = await this.readPackageJson();
        return {
            scannedAt: new Date().toISOString(),
            sourceFingerprint: await this.computeFingerprint(),
            packageName: packageJson.name,
            angularVersion: packageJson.dependencies['@angular/core'],
            components: sourceFiles.flatMap((file) => this.extractComponents(file)).sort(byPathThenName),
            services: sourceFiles.flatMap((file) => this.extractServices(file)).sort(byPathThenName),
            apiUsages: sourceFiles.flatMap((file) => this.extractApiUsages(file)).sort(byApiPath),
            routes: sourceFiles.flatMap((file) => this.extractRoutes(file)).sort(byRoutePath),
            store: this.extractStore(sourceFiles).sort((a, b) => a.directory.localeCompare(b.directory)),
            models: sourceFiles.flatMap((file) => this.extractModels(file)).sort(byPathThenName),
            utilities: sourceFiles.flatMap((file) => this.extractUtilities(file)).sort(byPathThenName),
            pipes: sourceFiles.flatMap((file) => this.extractDecoratedSymbols(file, 'Pipe')).sort(byPathThenName),
            directives: sourceFiles.flatMap((file) => this.extractDecoratedSymbols(file, 'Directive')).sort(byPathThenName),
            guards: sourceFiles.flatMap((file) => this.extractGuardSymbols(file)).sort(byPathThenName),
            interceptors: sourceFiles.flatMap((file) => this.extractInterceptorSymbols(file)).sort(byPathThenName),
            modules: sourceFiles.flatMap((file) => this.extractDecoratedSymbols(file, 'NgModule')).sort(byPathThenName),
        };
    }
    async computeFingerprint() {
        const files = await glob([...SOURCE_SCAN_GLOBS], {
            cwd: this.repoRoot,
            ignore: [...IGNORED_GLOBS],
            nodir: true,
            windowsPathsNoEscape: true,
        });
        const hash = crypto.createHash('sha256');
        for (const file of files.sort()) {
            const absolutePath = path.join(this.repoRoot, file);
            const stat = await fs.stat(absolutePath);
            hash.update(file);
            hash.update(String(stat.size));
            hash.update(String(Math.floor(stat.mtimeMs)));
        }
        return hash.digest('hex');
    }
    async findTsFiles() {
        return glob([...TS_SCAN_GLOBS], {
            cwd: this.repoRoot,
            ignore: [...IGNORED_GLOBS],
            nodir: true,
            windowsPathsNoEscape: true,
        });
    }
    async resolveTsConfig() {
        const tsConfig = path.join(this.repoRoot, 'tsconfig.json');
        return (await fs.pathExists(tsConfig)) ? tsConfig : undefined;
    }
    async readPackageJson() {
        const packageJsonPath = path.join(this.repoRoot, 'package.json');
        const packageJson = (await fs.readJson(packageJsonPath));
        return {
            name: packageJson.name ?? 'unknown',
            dependencies: packageJson.dependencies ?? {},
        };
    }
    extractComponents(sourceFile) {
        return sourceFile
            .getClasses()
            .filter((classDeclaration) => hasDecorator(classDeclaration, 'Component'))
            .map((classDeclaration) => {
            const metadata = getDecoratorMetadata(classDeclaration, 'Component');
            return {
                name: classDeclaration.getName() ?? 'AnonymousComponent',
                filePath: this.relativePath(sourceFile),
                exported: classDeclaration.isExported(),
                selector: getStringProperty(metadata, 'selector'),
                templateUrl: getStringProperty(metadata, 'templateUrl'),
                inputs: getDecoratedPropertyNames(classDeclaration, 'Input'),
                outputs: getDecoratedPropertyNames(classDeclaration, 'Output'),
                methods: getPublicMethodNames(classDeclaration),
                shared: this.relativePath(sourceFile).startsWith('src/app/shared/'),
            };
        });
    }
    extractServices(sourceFile) {
        const relativePath = this.relativePath(sourceFile);
        return sourceFile
            .getClasses()
            .filter((classDeclaration) => {
            const isServiceFile = relativePath.endsWith('.service.ts') ||
                relativePath.includes('/services/controllers/') ||
                relativePath.includes('\\services\\controllers\\');
            return isServiceFile || hasDecorator(classDeclaration, 'Injectable');
        })
            .map((classDeclaration) => ({
            name: classDeclaration.getName() ?? 'AnonymousService',
            filePath: relativePath,
            exported: classDeclaration.isExported(),
            injectable: hasDecorator(classDeclaration, 'Injectable'),
            controller: relativePath.includes('src/app/services/controllers/'),
            shared: relativePath.includes('src/app/services/shared/') || relativePath.includes('src/app/shared/'),
            methods: getPublicMethodNames(classDeclaration),
            dependencies: getConstructorDependencies(classDeclaration),
        }));
    }
    extractApiUsages(sourceFile) {
        const usages = [];
        const relativePath = this.relativePath(sourceFile);
        sourceFile.forEachDescendant((node) => {
            if (!Node.isCallExpression(node)) {
                return;
            }
            const expressionText = node.getExpression().getText();
            const methodName = expressionText.split('.').pop() ?? expressionText;
            const lowerMethod = methodName.toLowerCase();
            const isHttpVerb = ['get', 'post', 'put', 'patch', 'delete'].includes(lowerMethod);
            const usesCommonService = expressionText.includes('getModuleListByAdvFilter');
            if (!isHttpVerb && !usesCommonService) {
                return;
            }
            usages.push({
                filePath: relativePath,
                owner: getNearestClassName(node) ?? path.basename(relativePath),
                method: methodName,
                verb: isHttpVerb ? lowerMethod.toUpperCase() : undefined,
                target: extractCallTarget(node),
                usesCommonService,
            });
        });
        return usages;
    }
    extractRoutes(sourceFile) {
        const relativePath = this.relativePath(sourceFile);
        if (!relativePath.endsWith('routing.module.ts')) {
            return [];
        }
        const routes = [];
        sourceFile.getVariableDeclarations().forEach((declaration) => {
            if (declaration.getName() !== 'routes') {
                return;
            }
            const initializer = declaration.getInitializer();
            if (!initializer || !Node.isArrayLiteralExpression(initializer)) {
                return;
            }
            for (const element of initializer.getElements()) {
                if (Node.isObjectLiteralExpression(element)) {
                    routes.push(...this.readRouteObject(element, relativePath));
                }
            }
        });
        return routes;
    }
    readRouteObject(routeObject, filePath, parentPath = '') {
        const pathPart = getStringProperty(routeObject, 'path') ?? '';
        const fullPath = joinRoutePath(parentPath, pathPart);
        const route = {
            filePath,
            path: fullPath || '/',
            component: getTextProperty(routeObject, 'component'),
            loadChildren: getTextProperty(routeObject, 'loadChildren'),
            redirectTo: getStringProperty(routeObject, 'redirectTo'),
            guards: getArrayTextProperty(routeObject, 'canActivate'),
        };
        const childRoutes = [route];
        const children = getPropertyInitializer(routeObject, 'children');
        if (children && Node.isArrayLiteralExpression(children)) {
            for (const child of children.getElements()) {
                if (Node.isObjectLiteralExpression(child)) {
                    childRoutes.push(...this.readRouteObject(child, filePath, fullPath));
                }
            }
        }
        return childRoutes;
    }
    extractStore(sourceFiles) {
        const byDirectory = new Map();
        for (const sourceFile of sourceFiles) {
            const relativePath = this.relativePath(sourceFile);
            if (!relativePath.includes('src/app/store/')) {
                continue;
            }
            const directory = path.dirname(relativePath).replace(/\\/g, '/');
            const accumulator = byDirectory.get(directory) ??
                {
                    name: path.basename(directory),
                    directory,
                    actions: [],
                    reducers: [],
                    effects: [],
                };
            if (relativePath.endsWith('.actions.ts')) {
                accumulator.actions.push(...sourceFile.getClasses().map((item) => item.getName() ?? 'AnonymousAction'));
            }
            if (relativePath.endsWith('.reducer.ts')) {
                accumulator.reducers.push(...sourceFile.getVariableDeclarations().map((item) => item.getName()));
            }
            if (relativePath.endsWith('.effects.ts')) {
                accumulator.effects.push(...sourceFile.getClasses().map((item) => item.getName() ?? 'AnonymousEffects'));
            }
            byDirectory.set(directory, accumulator);
        }
        return [...byDirectory.values()].map((slice) => ({
            name: slice.name,
            directory: slice.directory,
            actions: uniqueSorted(slice.actions),
            reducers: uniqueSorted(slice.reducers),
            effects: uniqueSorted(slice.effects),
        }));
    }
    extractModels(sourceFile) {
        const relativePath = this.relativePath(sourceFile);
        const exportedOnly = relativePath.includes('src/app/core/') || relativePath.includes('src/app/shared/');
        const models = [];
        for (const item of sourceFile.getInterfaces()) {
            if (!exportedOnly || item.isExported()) {
                models.push({ name: item.getName(), filePath: relativePath, exported: item.isExported(), kind: 'interface' });
            }
        }
        for (const item of sourceFile.getTypeAliases()) {
            if (!exportedOnly || item.isExported()) {
                models.push({ name: item.getName(), filePath: relativePath, exported: item.isExported(), kind: 'type' });
            }
        }
        for (const item of sourceFile.getEnums()) {
            if (!exportedOnly || item.isExported()) {
                models.push({ name: item.getName(), filePath: relativePath, exported: item.isExported(), kind: 'enum' });
            }
        }
        for (const variable of sourceFile.getVariableDeclarations()) {
            const name = variable.getName();
            if (isConstantName(name) && variable.getVariableStatement()?.isExported()) {
                models.push({ name, filePath: relativePath, exported: true, kind: 'constant' });
            }
        }
        return models;
    }
    extractUtilities(sourceFile) {
        const relativePath = this.relativePath(sourceFile);
        if (!relativePath.includes('src/app/core/utils/') && !relativePath.includes('src/app/shared/')) {
            return [];
        }
        const utilities = [];
        for (const fn of sourceFile.getFunctions()) {
            if (fn.isExported()) {
                utilities.push({
                    name: fn.getName() ?? 'anonymousFunction',
                    filePath: relativePath,
                    exported: true,
                    kind: 'function',
                });
            }
        }
        for (const variable of sourceFile.getVariableDeclarations()) {
            if (variable.getVariableStatement()?.isExported()) {
                utilities.push({
                    name: variable.getName(),
                    filePath: relativePath,
                    exported: true,
                    kind: 'constant',
                });
            }
        }
        return utilities;
    }
    extractDecoratedSymbols(sourceFile, decoratorName) {
        return sourceFile
            .getClasses()
            .filter((classDeclaration) => hasDecorator(classDeclaration, decoratorName))
            .map((classDeclaration) => ({
            name: classDeclaration.getName() ?? `Anonymous${decoratorName}`,
            filePath: this.relativePath(sourceFile),
            exported: classDeclaration.isExported(),
        }));
    }
    extractGuardSymbols(sourceFile) {
        const relativePath = this.relativePath(sourceFile);
        if (!relativePath.endsWith('.guard.ts')) {
            return [];
        }
        return sourceFile.getClasses().map((classDeclaration) => ({
            name: classDeclaration.getName() ?? 'AnonymousGuard',
            filePath: relativePath,
            exported: classDeclaration.isExported(),
        }));
    }
    extractInterceptorSymbols(sourceFile) {
        const relativePath = this.relativePath(sourceFile);
        if (!relativePath.endsWith('.interceptor.ts')) {
            return [];
        }
        return sourceFile.getClasses().map((classDeclaration) => ({
            name: classDeclaration.getName() ?? 'AnonymousInterceptor',
            filePath: relativePath,
            exported: classDeclaration.isExported(),
        }));
    }
    relativePath(sourceFile) {
        return path.relative(this.repoRoot, sourceFile.getFilePath()).replace(/\\/g, '/');
    }
}
function hasDecorator(classDeclaration, decoratorName) {
    return classDeclaration.getDecorators().some((decorator) => decorator.getName() === decoratorName);
}
function getDecoratorMetadata(classDeclaration, decoratorName) {
    const decorator = classDeclaration.getDecorators().find((item) => item.getName() === decoratorName);
    return decorator ? getDecoratorObjectLiteral(decorator) : undefined;
}
function getDecoratorObjectLiteral(decorator) {
    const firstArgument = decorator.getArguments()[0];
    return firstArgument && Node.isObjectLiteralExpression(firstArgument) ? firstArgument : undefined;
}
function getStringProperty(objectLiteral, propertyName) {
    const initializer = getPropertyInitializer(objectLiteral, propertyName);
    if (!initializer || (!Node.isStringLiteral(initializer) && !Node.isNoSubstitutionTemplateLiteral(initializer))) {
        return undefined;
    }
    return initializer.getLiteralText();
}
function getTextProperty(objectLiteral, propertyName) {
    const initializer = getPropertyInitializer(objectLiteral, propertyName);
    return initializer?.getText();
}
function getArrayTextProperty(objectLiteral, propertyName) {
    const initializer = getPropertyInitializer(objectLiteral, propertyName);
    if (!initializer || !Node.isArrayLiteralExpression(initializer)) {
        return [];
    }
    return initializer.getElements().map((element) => element.getText());
}
function getPropertyInitializer(objectLiteral, propertyName) {
    if (!objectLiteral) {
        return undefined;
    }
    const property = objectLiteral.getProperty(propertyName);
    if (!property || !Node.isPropertyAssignment(property)) {
        return undefined;
    }
    return property.getInitializer();
}
function getDecoratedPropertyNames(classDeclaration, decoratorName) {
    return classDeclaration
        .getProperties()
        .filter((property) => property.getDecorators().some((decorator) => decorator.getName() === decoratorName))
        .map((property) => property.getName())
        .sort();
}
function getPublicMethodNames(classDeclaration) {
    return classDeclaration
        .getMethods()
        .filter((method) => method.getScope() !== Scope.Private)
        .map((method) => method.getName())
        .sort();
}
function getConstructorDependencies(classDeclaration) {
    const constructors = classDeclaration.getConstructors();
    if (!constructors.length) {
        return [];
    }
    return constructors[0].getParameters().map((parameter) => {
        const typeText = parameter.getTypeNode()?.getText();
        return typeText ? `${parameter.getName()}: ${typeText}` : parameter.getName();
    });
}
function getNearestClassName(node) {
    const parentClass = node.getFirstAncestorByKind(SyntaxKind.ClassDeclaration);
    return parentClass?.getName();
}
function extractCallTarget(node) {
    if (!Node.isCallExpression(node)) {
        return undefined;
    }
    const firstArgument = node.getArguments()[0];
    if (!firstArgument) {
        return undefined;
    }
    if (Node.isStringLiteral(firstArgument) || Node.isNoSubstitutionTemplateLiteral(firstArgument)) {
        return firstArgument.getLiteralText();
    }
    if (Node.isObjectLiteralExpression(firstArgument)) {
        const pathValue = getStringProperty(firstArgument, 'path');
        if (pathValue) {
            return pathValue;
        }
    }
    return firstArgument.getText();
}
function joinRoutePath(parentPath, childPath) {
    return [parentPath, childPath]
        .filter(Boolean)
        .join('/')
        .replace(/\/+/g, '/')
        .replace(/^\//, '');
}
function uniqueSorted(values) {
    return [...new Set(values.filter(Boolean))].sort();
}
function isConstantName(name) {
    return /^[A-Z][A-Z0-9_]+$/.test(name);
}
function byPathThenName(left, right) {
    return left.filePath.localeCompare(right.filePath) || left.name.localeCompare(right.name);
}
function byApiPath(left, right) {
    return left.filePath.localeCompare(right.filePath) || left.method.localeCompare(right.method);
}
function byRoutePath(left, right) {
    return left.filePath.localeCompare(right.filePath) || left.path.localeCompare(right.path);
}
//# sourceMappingURL=angular-scanner.js.map