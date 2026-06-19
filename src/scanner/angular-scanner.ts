import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'fs-extra';
import { glob } from 'glob';
import {
  ClassDeclaration,
  Decorator,
  Node,
  ObjectLiteralExpression,
  Project,
  PropertyAssignment,
  Scope,
  SourceFile,
  SyntaxKind,
} from 'ts-morph';
import {
  IGNORED_GLOBS,
  SOURCE_SCAN_GLOBS,
  TS_SCAN_GLOBS,
} from '../core/constants.js';
import type {
  AngularSymbol,
  ApiUsage,
  ComponentSymbol,
  ModelSymbol,
  RouteSymbol,
  ScanResult,
  ServiceSymbol,
  StoreSlice,
  UtilitySymbol,
} from './models.js';

export class AngularProjectScanner {
  constructor(private readonly repoRoot: string) {}

  async scan(): Promise<ScanResult> {
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

  async computeFingerprint(): Promise<string> {
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

  private async findTsFiles(): Promise<string[]> {
    return glob([...TS_SCAN_GLOBS], {
      cwd: this.repoRoot,
      ignore: [...IGNORED_GLOBS],
      nodir: true,
      windowsPathsNoEscape: true,
    });
  }

  private async resolveTsConfig(): Promise<string | undefined> {
    const tsConfig = path.join(this.repoRoot, 'tsconfig.json');
    return (await fs.pathExists(tsConfig)) ? tsConfig : undefined;
  }

  private async readPackageJson(): Promise<{
    readonly name: string;
    readonly dependencies: Record<string, string>;
  }> {
    const packageJsonPath = path.join(this.repoRoot, 'package.json');
    const packageJson = (await fs.readJson(packageJsonPath)) as {
      readonly name?: string;
      readonly dependencies?: Record<string, string>;
    };

    return {
      name: packageJson.name ?? 'unknown',
      dependencies: packageJson.dependencies ?? {},
    };
  }

  private extractComponents(sourceFile: SourceFile): ComponentSymbol[] {
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

  private extractServices(sourceFile: SourceFile): ServiceSymbol[] {
    const relativePath = this.relativePath(sourceFile);
    return sourceFile
      .getClasses()
      .filter((classDeclaration) => {
        const isServiceFile =
          relativePath.endsWith('.service.ts') ||
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

  private extractApiUsages(sourceFile: SourceFile): ApiUsage[] {
    const usages: ApiUsage[] = [];
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

  private extractRoutes(sourceFile: SourceFile): RouteSymbol[] {
    const relativePath = this.relativePath(sourceFile);

    if (!relativePath.endsWith('routing.module.ts')) {
      return [];
    }

    const routes: RouteSymbol[] = [];

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

  private readRouteObject(routeObject: ObjectLiteralExpression, filePath: string, parentPath = ''): RouteSymbol[] {
    const pathPart = getStringProperty(routeObject, 'path') ?? '';
    const fullPath = joinRoutePath(parentPath, pathPart);
    const route: RouteSymbol = {
      filePath,
      path: fullPath || '/',
      component: getTextProperty(routeObject, 'component'),
      loadChildren: getTextProperty(routeObject, 'loadChildren'),
      redirectTo: getStringProperty(routeObject, 'redirectTo'),
      guards: getArrayTextProperty(routeObject, 'canActivate'),
    };
    const childRoutes: RouteSymbol[] = [route];
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

  private extractStore(sourceFiles: readonly SourceFile[]): StoreSlice[] {
    const byDirectory = new Map<string, StoreSliceAccumulator>();

    for (const sourceFile of sourceFiles) {
      const relativePath = this.relativePath(sourceFile);
      if (!relativePath.includes('src/app/store/')) {
        continue;
      }

      const directory = path.dirname(relativePath).replace(/\\/g, '/');
      const accumulator =
        byDirectory.get(directory) ??
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

  private extractModels(sourceFile: SourceFile): ModelSymbol[] {
    const relativePath = this.relativePath(sourceFile);
    const exportedOnly = relativePath.includes('src/app/core/') || relativePath.includes('src/app/shared/');
    const models: ModelSymbol[] = [];

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

  private extractUtilities(sourceFile: SourceFile): UtilitySymbol[] {
    const relativePath = this.relativePath(sourceFile);
    if (!relativePath.includes('src/app/core/utils/') && !relativePath.includes('src/app/shared/')) {
      return [];
    }

    const utilities: UtilitySymbol[] = [];

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

  private extractDecoratedSymbols(sourceFile: SourceFile, decoratorName: string): AngularSymbol[] {
    return sourceFile
      .getClasses()
      .filter((classDeclaration) => hasDecorator(classDeclaration, decoratorName))
      .map((classDeclaration) => ({
        name: classDeclaration.getName() ?? `Anonymous${decoratorName}`,
        filePath: this.relativePath(sourceFile),
        exported: classDeclaration.isExported(),
      }));
  }

  private extractGuardSymbols(sourceFile: SourceFile): AngularSymbol[] {
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

  private extractInterceptorSymbols(sourceFile: SourceFile): AngularSymbol[] {
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

  private relativePath(sourceFile: SourceFile): string {
    return path.relative(this.repoRoot, sourceFile.getFilePath()).replace(/\\/g, '/');
  }
}

interface StoreSliceAccumulator {
  readonly name: string;
  readonly directory: string;
  readonly actions: string[];
  readonly reducers: string[];
  readonly effects: string[];
}

function hasDecorator(classDeclaration: ClassDeclaration, decoratorName: string): boolean {
  return classDeclaration.getDecorators().some((decorator) => decorator.getName() === decoratorName);
}

function getDecoratorMetadata(
  classDeclaration: ClassDeclaration,
  decoratorName: string
): ObjectLiteralExpression | undefined {
  const decorator = classDeclaration.getDecorators().find((item) => item.getName() === decoratorName);
  return decorator ? getDecoratorObjectLiteral(decorator) : undefined;
}

function getDecoratorObjectLiteral(decorator: Decorator): ObjectLiteralExpression | undefined {
  const firstArgument = decorator.getArguments()[0];
  return firstArgument && Node.isObjectLiteralExpression(firstArgument) ? firstArgument : undefined;
}

function getStringProperty(objectLiteral: ObjectLiteralExpression | undefined, propertyName: string): string | undefined {
  const initializer = getPropertyInitializer(objectLiteral, propertyName);

  if (!initializer || (!Node.isStringLiteral(initializer) && !Node.isNoSubstitutionTemplateLiteral(initializer))) {
    return undefined;
  }

  return initializer.getLiteralText();
}

function getTextProperty(objectLiteral: ObjectLiteralExpression | undefined, propertyName: string): string | undefined {
  const initializer = getPropertyInitializer(objectLiteral, propertyName);
  return initializer?.getText();
}

function getArrayTextProperty(objectLiteral: ObjectLiteralExpression | undefined, propertyName: string): readonly string[] {
  const initializer = getPropertyInitializer(objectLiteral, propertyName);
  if (!initializer || !Node.isArrayLiteralExpression(initializer)) {
    return [];
  }

  return initializer.getElements().map((element) => element.getText());
}

function getPropertyInitializer(
  objectLiteral: ObjectLiteralExpression | undefined,
  propertyName: string
): Node | undefined {
  if (!objectLiteral) {
    return undefined;
  }

  const property = objectLiteral.getProperty(propertyName);
  if (!property || !Node.isPropertyAssignment(property)) {
    return undefined;
  }

  return (property as PropertyAssignment).getInitializer();
}

function getDecoratedPropertyNames(classDeclaration: ClassDeclaration, decoratorName: string): readonly string[] {
  return classDeclaration
    .getProperties()
    .filter((property) => property.getDecorators().some((decorator) => decorator.getName() === decoratorName))
    .map((property) => property.getName())
    .sort();
}

function getPublicMethodNames(classDeclaration: ClassDeclaration): readonly string[] {
  return classDeclaration
    .getMethods()
    .filter((method) => method.getScope() !== Scope.Private)
    .map((method) => method.getName())
    .sort();
}

function getConstructorDependencies(classDeclaration: ClassDeclaration): readonly string[] {
  const constructors = classDeclaration.getConstructors();
  if (!constructors.length) {
    return [];
  }

  return constructors[0].getParameters().map((parameter) => {
    const typeText = parameter.getTypeNode()?.getText();
    return typeText ? `${parameter.getName()}: ${typeText}` : parameter.getName();
  });
}

function getNearestClassName(node: Node): string | undefined {
  const parentClass = node.getFirstAncestorByKind(SyntaxKind.ClassDeclaration);
  return parentClass?.getName();
}

function extractCallTarget(node: Node): string | undefined {
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

function joinRoutePath(parentPath: string, childPath: string): string {
  return [parentPath, childPath]
    .filter(Boolean)
    .join('/')
    .replace(/\/+/g, '/')
    .replace(/^\//, '');
}

function uniqueSorted(values: readonly string[]): readonly string[] {
  return [...new Set(values.filter(Boolean))].sort();
}

function isConstantName(name: string): boolean {
  return /^[A-Z][A-Z0-9_]+$/.test(name);
}

function byPathThenName(left: AngularSymbol, right: AngularSymbol): number {
  return left.filePath.localeCompare(right.filePath) || left.name.localeCompare(right.name);
}

function byApiPath(left: ApiUsage, right: ApiUsage): number {
  return left.filePath.localeCompare(right.filePath) || left.method.localeCompare(right.method);
}

function byRoutePath(left: RouteSymbol, right: RouteSymbol): number {
  return left.filePath.localeCompare(right.filePath) || left.path.localeCompare(right.path);
}
