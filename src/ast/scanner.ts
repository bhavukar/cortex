import * as fs from 'fs';
import * as path from 'path';
import { ArchitecturalBlueprint, GraphEdge, GraphNode } from '../types.js';

export interface ScanResult {
  blueprint: ArchitecturalBlueprint;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export class CodebaseScanner {
  private rootDir: string;
  private ignoreDirs = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'out', 'target', '.gemini']);

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
  }

  public async scan(): Promise<ScanResult> {
    const files = this.collectFiles(this.rootDir);
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    const blueprint = this.detectBlueprint(files);

    for (const relPath of files) {
      const fullPath = path.join(this.rootDir, relPath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const ext = path.extname(relPath);

      const parsed = this.parseFile(relPath, content, ext);
      
      const fileNode: GraphNode = {
        id: `file:${relPath}`,
        type: 'file',
        label: path.basename(relPath),
        summary: parsed.summary,
        status: 'verified',
        path: relPath,
        exports: parsed.exports,
        imports: parsed.imports,
        weight: 1.0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      nodes.push(fileNode);

      // Create import edges
      for (const imp of parsed.imports) {
        const targetRel = this.resolveImportPath(relPath, imp);
        if (targetRel) {
          edges.push({
            from: `file:${relPath}`,
            to: `file:${targetRel}`,
            relation: 'imports',
            weight: 1.0
          });
        }
      }
    }

    return { blueprint, nodes, edges };
  }

  private collectFiles(dir: string, baseDir: string = dir): string[] {
    const results: string[] = [];
    if (!fs.existsSync(dir)) return results;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (this.ignoreDirs.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...this.collectFiles(fullPath, baseDir));
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (['.ts', '.tsx', '.js', '.jsx', '.py', '.rs', '.go', '.dart', '.json'].includes(ext)) {
          results.push(path.relative(baseDir, fullPath));
        }
      }
    }
    return results;
  }

  private parseFile(relPath: string, content: string, ext: string): { exports: string[]; imports: string[]; summary: string } {
    const exports: string[] = [];
    const imports: string[] = [];

    if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
      // Extract imports
      const importRegex = /(?:import|from)\s+['"]([^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }

      // Extract exports
      const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var|type|interface|enum)\s+([a-zA-Z0-9_$]+)/g;
      while ((match = exportRegex.exec(content)) !== null) {
        exports.push(match[1]);
      }
    } else if (ext === '.py') {
      const pyImportRegex = /(?:from\s+([a-zA-Z0-9_.]+)\s+import|import\s+([a-zA-Z0-9_.]+))/g;
      let match;
      while ((match = pyImportRegex.exec(content)) !== null) {
        imports.push(match[1] || match[2]);
      }
      const pyDefRegex = /def\s+([a-zA-Z0-9_]+)\s*\(/g;
      while ((match = pyDefRegex.exec(content)) !== null) {
        exports.push(match[1]);
      }
    } else if (ext === '.dart') {
      const dartImportRegex = /import\s+['"]([^'"]+)['"]/g;
      let match;
      while ((match = dartImportRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
      const dartClassRegex = /class\s+([a-zA-Z0-9_]+)/g;
      while ((match = dartClassRegex.exec(content)) !== null) {
        exports.push(match[1]);
      }
    }

    const firstComment = content.match(/\/\*\*?([\s\S]*?)\*\//);
    const summary = firstComment ? firstComment[1].replace(/\*/g, '').trim().slice(0, 150) : `${path.basename(relPath)} module`;

    return { exports, imports, summary };
  }

  private resolveImportPath(currentFile: string, importStr: string): string | null {
    if (!importStr.startsWith('.')) return null;
    const currentDir = path.dirname(currentFile);
    const resolved = path.normalize(path.join(currentDir, importStr));

    const possibleExtensions = ['', '.ts', '.tsx', '.js', '.jsx', '.dart', '/index.ts', '/index.js'];
    for (const ext of possibleExtensions) {
      const candidate = resolved + ext;
      if (fs.existsSync(path.join(this.rootDir, candidate))) {
        return candidate;
      }
    }
    return null;
  }

  private detectBlueprint(files: string[]): ArchitecturalBlueprint {
    let framework = 'Generic / Standalone';
    let pattern = 'Modular Architecture';
    const invariants: string[] = [];
    const designSystem: ArchitecturalBlueprint['designSystem'] = { rules: [] };

    const hasPackageJson = files.includes('package.json');
    if (hasPackageJson) {
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(this.rootDir, 'package.json'), 'utf-8'));
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (deps.next) framework = 'Next.js (App / Pages Router)';
        else if (deps.react) framework = 'React SPA';
        else if (deps.express) framework = 'Express.js API';
        else if (deps['@modelcontextprotocol/sdk']) framework = 'Model Context Protocol (MCP) Server';
      } catch {
        // Fallback
      }
    }

    if (files.some(f => f.includes('flutter') || f.endsWith('.dart'))) {
      framework = 'Flutter / Dart';
      pattern = 'BLoC / Clean Architecture';
    }

    // Detect Design System
    const textInputFile = files.find(f => f.toLowerCase().includes('text_input') || f.toLowerCase().includes('textinput'));
    if (textInputFile) {
      designSystem.inputs = textInputFile;
      invariants.push(`Custom input component located at ${textInputFile} must be used across all forms.`);
    }

    const buttonFile = files.find(f => f.toLowerCase().includes('button.'));
    if (buttonFile) {
      designSystem.buttons = buttonFile;
    }

    invariants.push('Preserve type safety and export public APIs with clear parameter types.');

    return {
      framework,
      pattern,
      designSystem,
      invariants
    };
  }
}
