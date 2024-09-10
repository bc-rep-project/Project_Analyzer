package com.yourcompany.pmd; // Your package name here  

import net.sourceforge.pmd.lang.java.ast.ASTMethodDeclaration;
import net.sourceforge.pmd.lang.java.ast.ASTMethodCallExpr; 
import net.sourceforge.pmd.lang.java.rule.AbstractJavaRule; 
import net.sourceforge.pmd.RuleContext;

public class FunctionCallRule extends AbstractJavaRule { 

    @Override 
    public Object visit(ASTMethodDeclaration node, Object data) { 
        return super.visit(node, data);  // Necessary for proper tree traversal!
    } 

    @Override 
    public Object visit(ASTMethodCallExpr callExpr, Object data) {
        RuleContext ctx = (RuleContext) data; 
        
        String caller = ""; 
        String callee = callExpr.getMethodCall().getName(); // Retrieve callee method name  
         
        // Get caller method name if inside a method declaration  
        ASTMethodDeclaration enclosingMethod = callExpr.getFirstParentOfType(ASTMethodDeclaration.class);  
        if (enclosingMethod != null) {
            caller = enclosingMethod.getName(); 
        }  
        // Add a "violation" - in our case, each function call is reported 
        ctx.getReport().addViolationWithMessage( 
                this,
                callExpr,  
                "Function Call Detected:\n   Caller: " + caller + "\n   Callee: " + callee, 
                caller,  // Data for 'source' in JSON (make extraction in Python easy)
                callee   // Data for 'target' in JSON 
        ); 
         
        return super.visit(callExpr, data); 
    } 
} 