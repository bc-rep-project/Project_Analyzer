"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeTypeScriptRepository = analyzeTypeScriptRepository;
//backend/analyzer/analysis_utils/analyze_typescript.ts
var ts = __importStar(require("typescript"));
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
function analyzeTypeScriptFile(filePath) {
    var program = ts.createProgram([filePath], {});
    var sourceFile = program.getSourceFile(filePath);
    if (!sourceFile) {
        console.error("Error: Could not parse source file: ".concat(filePath));
        return { nodes: [], links: [] };
    }
    var nodes = [{ id: filePath, type: 'file' }];
    var links = [];
    function visit(node) {
        if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) {
            var functionName_1 = node.name ? node.name.getText(sourceFile) : 'anonymous';
            nodes.push({ id: functionName_1, type: 'function', parent: filePath });
            ts.forEachChild(node, function (child) {
                if (ts.isCallExpression(child)) {
                    var calledFunction = child.expression.getText(sourceFile);
                    links.push({ source: functionName_1, target: calledFunction });
                }
            });
        }
        ts.forEachChild(node, visit);
    }
    visit(sourceFile);
    return { nodes: nodes, links: links };
}
function analyzeTypeScriptRepository(repoPath) {
    var nodes = [];
    var links = [];
    function walkDirectory(directory) {
        var items = fs.readdirSync(directory);
        for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
            var item = items_1[_i];
            var fullPath = path.join(directory, item);
            var stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                walkDirectory(fullPath);
            }
            else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
                var _a = analyzeTypeScriptFile(fullPath), fileNodes = _a.nodes, fileLinks = _a.links;
                nodes.push.apply(nodes, fileNodes);
                links.push.apply(links, fileLinks);
            }
        }
    }
    walkDirectory(repoPath);
    return { nodes: nodes, links: links };
}
