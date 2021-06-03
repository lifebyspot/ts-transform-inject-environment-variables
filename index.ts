import 'dotenv/config';

import ts, { SyntaxKind, factory, isBinaryExpression, isElementAccessExpression, isObjectBindingPattern, isPropertyAccessExpression, isVariableDeclaration } from 'typescript';

const getEnvironmentVariable = (variableName: string) => process.env[variableName] !== undefined
    ? factory.createStringLiteral(process.env[variableName], true)
    : undefined;

const getVariableNames = (expression: ts.BinaryExpression | ts.PropertyAccessExpression | ts.ElementAccessExpression, optionalExpression?: ts.Expression): [string, ts.Expression] => {
    let variableName;
    switch (expression.kind) {
        case SyntaxKind.PropertyAccessExpression:
            variableName =  expression.name.getText();
            break;
        case SyntaxKind.ElementAccessExpression:
            variableName = expression.argumentExpression.getText().replace(/'/g, '');
            break;
        case SyntaxKind.BinaryExpression:
            const leftHandSideExpression = expression.left;
            const rightHandSideExpression = expression.right;

            return getVariableNames(leftHandSideExpression as (ts.BinaryExpression | ts.PropertyAccessExpression | ts.ElementAccessExpression),
                rightHandSideExpression);
    }

    return [variableName, optionalExpression];
}

const reassignVariableValue = (declaration: ts.VariableDeclaration, expression: ts.BinaryExpression | ts.PropertyAccessExpression | ts.ElementAccessExpression): ts.VariableDeclaration => {
    const [envVariableName, optionalExpression] = getVariableNames(expression);
    
    return factory.updateVariableDeclaration(declaration, 
        declaration.name,
        declaration.exclamationToken,
        declaration.type,
        getEnvironmentVariable(envVariableName) ?? optionalExpression);
}

const destructureVariables = (declaration: ts.VariableDeclaration, binding: ts.ObjectBindingPattern): ts.VariableDeclaration => {
    return factory.updateVariableDeclaration(declaration, factory.updateObjectBindingPattern(binding, binding.elements.map(element => {
        const envVariableName = element.propertyName?.getText() ?? element.name.getText();
        
        const result = factory.updateBindingElement(element,
            element.dotDotDotToken,
            element.propertyName,
            element.name,
            getEnvironmentVariable(envVariableName) ?? element.initializer);

        return result;
    })), declaration.exclamationToken, declaration.type, factory.createObjectLiteralExpression([]));
};

const getVisitor = (transformationContext: ts.TransformationContext): ts.Visitor => {
    const visitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
        if (isVariableDeclaration(node)) {
            if (node.getText().includes('process.env') ?? false) {
                const idLike = node.getChildren().find(node => isBinaryExpression(node) || isPropertyAccessExpression(node) || isElementAccessExpression(node) || isObjectBindingPattern(node));

                if (idLike === undefined) {
                    return node;
                }

                if (isBinaryExpression(idLike) || isPropertyAccessExpression(idLike) || isElementAccessExpression(idLike)) {
                    return reassignVariableValue(node, idLike);
                } else if (isObjectBindingPattern(idLike)) {
                    return destructureVariables(node, idLike as ts.ObjectBindingPattern);
                }
            }
        
            return node;
        }

        return ts.visitEachChild(node, visitor, transformationContext);
    };

    return visitor;
};

const injectEnvVarsTransform = (_: ts.Program) => (transformationContext: ts.TransformationContext) => (sourceFile: ts.SourceFile) => {
    const visitor = getVisitor(transformationContext);

    const result = ts.visitNode(sourceFile, visitor);
    return result;
};

export default injectEnvVarsTransform;
