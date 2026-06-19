export interface AngularSymbol {
  readonly name: string;
  readonly filePath: string;
  readonly exported: boolean;
}

export interface ComponentSymbol extends AngularSymbol {
  readonly selector?: string;
  readonly templateUrl?: string;
  readonly inputs: readonly string[];
  readonly outputs: readonly string[];
  readonly methods: readonly string[];
  readonly shared: boolean;
}

export interface ServiceSymbol extends AngularSymbol {
  readonly injectable: boolean;
  readonly controller: boolean;
  readonly shared: boolean;
  readonly methods: readonly string[];
  readonly dependencies: readonly string[];
}

export interface ApiUsage {
  readonly filePath: string;
  readonly owner: string;
  readonly method: string;
  readonly verb?: string;
  readonly target?: string;
  readonly usesCommonService: boolean;
}

export interface RouteSymbol {
  readonly filePath: string;
  readonly path: string;
  readonly component?: string;
  readonly loadChildren?: string;
  readonly redirectTo?: string;
  readonly guards: readonly string[];
}

export interface StoreSlice {
  readonly name: string;
  readonly directory: string;
  readonly actions: readonly string[];
  readonly reducers: readonly string[];
  readonly effects: readonly string[];
}

export interface ModelSymbol extends AngularSymbol {
  readonly kind: 'interface' | 'type' | 'enum' | 'constant';
}

export interface UtilitySymbol extends AngularSymbol {
  readonly kind: 'function' | 'constant';
}

export interface ScanResult {
  readonly scannedAt: string;
  readonly sourceFingerprint: string;
  readonly packageName: string;
  readonly angularVersion?: string;
  readonly components: readonly ComponentSymbol[];
  readonly services: readonly ServiceSymbol[];
  readonly apiUsages: readonly ApiUsage[];
  readonly routes: readonly RouteSymbol[];
  readonly store: readonly StoreSlice[];
  readonly models: readonly ModelSymbol[];
  readonly utilities: readonly UtilitySymbol[];
  readonly pipes: readonly AngularSymbol[];
  readonly directives: readonly AngularSymbol[];
  readonly guards: readonly AngularSymbol[];
  readonly interceptors: readonly AngularSymbol[];
  readonly modules: readonly AngularSymbol[];
}
