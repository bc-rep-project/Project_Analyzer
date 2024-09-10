#include "clang/AST/ASTConsumer.h"
#include "clang/AST/RecursiveASTVisitor.h"
#include "clang/Frontend/CompilerInstance.h"
#include "clang/Frontend/FrontendAction.h"
#include "clang/Tooling/CommonOptionsParser.h"
#include "clang/Tooling/Tooling.h"
#include "llvm/Support/raw_ostream.h"
#include <nlohmann/json.hpp>
#include <fstream>
#include <string>
#include <set>
using namespace clang;
using namespace clang::tooling;
using json = nlohmann::json;
// Custom AST visitor to find function calls
class FunctionCallVisitor : public RecursiveASTVisitor<FunctionCallVisitor> {
public:
    explicit FunctionCallVisitor(ASTContext *Context, json &outputJson)
        : Context(Context), outputJson(outputJson) {}

    bool VisitFunctionDecl(FunctionDecl *funcDecl) {
        if (funcDecl->isThisDeclarationADefinition()) {
            std::string funcName = funcDecl->getQualifiedNameAsString();
            if (visitedFunctions.find(funcName) == visitedFunctions.end()) {
                json node;
                node["id"] = funcName;
                node["type"] = "function";
                node["parent"] = Context->getSourceManager().getFilename(funcDecl->getLocation()).str();
                outputJson["nodes"].push_back(node);
                visitedFunctions.insert(funcName);
            }
        }
        return true;
    }
    bool VisitCallExpr(CallExpr *callExpr) {
        FunctionDecl *calleeDecl = callExpr->getDirectCallee();
        if (calleeDecl) {
            FunctionDecl *callerDecl = llvm::dyn_cast<FunctionDecl>(callExpr->getExprLoc().getDeclContext());
            if (callerDecl) {
                json link;
                link["source"] = callerDecl->getQualifiedNameAsString();
                link["target"] = calleeDecl->getQualifiedNameAsString();
                outputJson["links"].push_back(link);
            }
        }
        return true; 
    }
private:
    ASTContext *Context;
    json &outputJson;
    std::set<std::string> visitedFunctions;
};
// Consumer to run our visitor over each source file
class FunctionCallConsumer : public ASTConsumer {
public:
    explicit FunctionCallConsumer(ASTContext *Context, json &outputJson)
        : Visitor(Context, outputJson) {}

    void HandleTranslationUnit(ASTContext &Context) override {
        Visitor.TraverseDecl(Context.getTranslationUnitDecl());
    }
private:
    FunctionCallVisitor Visitor;
};
// Frontend action to execute the analysis
class FunctionCallAction : public ASTFrontendAction {
public:
    FunctionCallAction() = default;
    std::unique_ptr<ASTConsumer> CreateASTConsumer(CompilerInstance &Compiler, StringRef InFile) override {
        return std::make_unique<FunctionCallConsumer>(&Compiler.getASTContext(), outputJson); 
    }

    void EndSourceFileAction() override {
        std::ofstream outputFile("function_calls.json");
        if (outputFile.is_open()) {
            outputFile << outputJson.dump(2) << std::endl; 
            outputFile.close(); 
        } else { 
            llvm::errs() << "Error: Couldn't open output file for writing!\n"; 
        }
    }

private:
    json outputJson;
};
// Driver
int main(int argc, const char **argv) {
    CommonOptionsParser op(argc, argv, ToolingSampleCategory);
    ClangTool Tool(op.getCompilations(), op.getSourcePathList());
    return Tool.run(newFrontendActionFactory<FunctionCallAction>().get());
}