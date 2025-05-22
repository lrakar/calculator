class Fraction {
    constructor(numerator, denominator = 1) {
        if (denominator === 0) {
            throw new Error("Denominator cannot be zero");
        }
        
        // Handle negative fractions
        if (denominator < 0) {
            numerator = -numerator;
            denominator = -denominator;
        }
        
        const gcd = this.gcd(Math.abs(numerator), Math.abs(denominator));
        this.numerator = numerator / gcd;
        this.denominator = denominator / gcd;
    }
    
    gcd(a, b) {
        return b === 0 ? a : this.gcd(b, a % b);
    }
    
    add(other) {
        const num = this.numerator * other.denominator + other.numerator * this.denominator;
        const den = this.denominator * other.denominator;
        return new Fraction(num, den);
    }
    
    subtract(other) {
        const num = this.numerator * other.denominator - other.numerator * this.denominator;
        const den = this.denominator * other.denominator;
        return new Fraction(num, den);
    }
    
    multiply(other) {
        return new Fraction(this.numerator * other.numerator, this.denominator * other.denominator);
    }
    
    divide(other) {
        if (other.numerator === 0) {
            throw new Error("Cannot divide by zero");
        }
        return new Fraction(this.numerator * other.denominator, this.denominator * other.numerator);
    }
    
    toDecimal() {
        return this.numerator / this.denominator;
    }
    
    toString() {
        if (this.denominator === 1) {
            return this.numerator.toString();
        }
        return `${this.numerator}/${this.denominator}`;
    }
    
    isInteger() {
        return this.denominator === 1;
    }
}

class ExpressionParser {
    constructor(expression) {
        this.expression = expression.replace(/\s+/g, '');
        this.pos = 0;
    }
    
    parse() {
        const result = this.parseExpression();
        if (this.pos < this.expression.length) {
            throw new Error("Unexpected character at position " + this.pos);
        }
        return result;
    }
    
    parseExpression() {
        let left = this.parseTerm();
        
        while (this.pos < this.expression.length) {
            const operator = this.expression[this.pos];
            if (operator === '+' || operator === '-') {
                this.pos++;
                const right = this.parseTerm();
                if (operator === '+') {
                    left = left.add(right);
                } else {
                    left = left.subtract(right);
                }
            } else {
                break;
            }
        }
        
        return left;
    }
    
    parseTerm() {
        let left = this.parseFactor();
        
        while (this.pos < this.expression.length) {
            const char = this.expression[this.pos];
            if (char === '*' || char === '/') {
                this.pos++;
                const right = this.parseFactor();
                if (char === '*') {
                    left = left.multiply(right);
                } else {
                    left = left.divide(right);
                }
            } else {
                break;
            }
        }
        
        return left;
    }
    
    parseFactor() {
        if (this.pos >= this.expression.length) {
            throw new Error("Unexpected end of expression");
        }
        
        const char = this.expression[this.pos];
        
        if (char === '(') {
            this.pos++;
            const result = this.parseExpression();
            if (this.pos >= this.expression.length || this.expression[this.pos] !== ')') {
                throw new Error("Missing closing parenthesis");
            }
            this.pos++;
            return result;
        }
        
        if (char === '-') {
            this.pos++;
            const factor = this.parseFactor();
            return new Fraction(-factor.numerator, factor.denominator);
        }
        
        return this.parseNumber();
    }
    
    parseNumber() {
        let numStr = '';
        let hasDecimal = false;
        
        while (this.pos < this.expression.length) {
            const char = this.expression[this.pos];
            if (char >= '0' && char <= '9') {
                numStr += char;
                this.pos++;
            } else if (char === '.' && !hasDecimal) {
                hasDecimal = true;
                numStr += char;
                this.pos++;
            } else {
                break;
            }
        }
        
        if (numStr === '') {
            throw new Error("Expected number at position " + this.pos);
        }
        
        if (hasDecimal) {
            const decimalPlaces = numStr.split('.')[1].length;
            const multiplier = Math.pow(10, decimalPlaces);
            const numerator = Math.round(parseFloat(numStr) * multiplier);
            return new Fraction(numerator, multiplier);
        } else {
            return new Fraction(parseInt(numStr));
        }
    }
}

class MathRenderer {
    static renderExpression(expression) {
        try {
            const ast = this.buildAST(expression);
            return this.renderAST(ast);
        } catch (error) {
            return `<span class="error">Error: ${error.message}</span>`;
        }
    }
    
    static buildAST(expression) {
        const tokens = this.tokenize(expression);
        return this.parseTokens(tokens);
    }
    
    static tokenize(expression) {
        const tokens = [];
        let i = 0;
        
        while (i < expression.length) {
            const char = expression[i];
            
            if (char === ' ') {
                i++;
                continue;
            }
            
            if ('+-*/()'.includes(char)) {
                tokens.push({ type: 'operator', value: char });
                i++;
            } else if (char >= '0' && char <= '9' || char === '.') {
                let num = '';
                while (i < expression.length && (expression[i] >= '0' && expression[i] <= '9' || expression[i] === '.')) {
                    num += expression[i];
                    i++;
                }
                tokens.push({ type: 'number', value: num });
            } else {
                throw new Error(`Invalid character: ${char}`);
            }
        }
        
        return tokens;
    }
    
    static parseTokens(tokens) {
        let pos = 0;
        
        function parseExpression() {
            let left = parseTerm();
            
            while (pos < tokens.length && (tokens[pos].value === '+' || tokens[pos].value === '-')) {
                const operator = tokens[pos++];
                const right = parseTerm();
                left = {
                    type: 'binary',
                    operator: operator.value,
                    left: left,
                    right: right
                };
            }
            
            return left;
        }
        
        function parseTerm() {
            let left = parseFactor();
            
            while (pos < tokens.length && (tokens[pos].value === '*' || tokens[pos].value === '/')) {
                const operator = tokens[pos++];
                const right = parseFactor();
                left = {
                    type: 'binary',
                    operator: operator.value,
                    left: left,
                    right: right
                };
            }
            
            return left;
        }
        
        function parseFactor() {
            if (pos >= tokens.length) {
                throw new Error("Unexpected end of expression");
            }
            
            const token = tokens[pos];
            
            if (token.value === '(') {
                pos++;
                const expr = parseExpression();
                if (pos >= tokens.length || tokens[pos].value !== ')') {
                    throw new Error("Missing closing parenthesis");
                }
                pos++;
                return { type: 'group', expression: expr };
            }
            
            if (token.value === '-') {
                pos++;
                const factor = parseFactor();
                return { type: 'unary', operator: '-', operand: factor };
            }
            
            if (token.type === 'number') {
                pos++;
                return { type: 'number', value: token.value };
            }
            
            throw new Error(`Unexpected token: ${token.value}`);
        }
        
        return parseExpression();
    }
    
    static renderAST(node) {
        if (node.type === 'number') {
            return `<span class="number">${node.value}</span>`;
        }
        
        if (node.type === 'unary') {
            return `<span class="operator">-</span>${this.renderAST(node.operand)}`;
        }
        
        if (node.type === 'group') {
            // Check if parentheses are unnecessary
            if (this.isSimpleExpression(node.expression)) {
                return `<span class="nested-expression">${this.renderAST(node.expression)}</span>`;
            }
            return `<span class="parentheses">(</span><span class="nested-expression">${this.renderAST(node.expression)}</span><span class="parentheses">)</span>`;
        }
        
        if (node.type === 'binary') {
            const left = this.renderAST(node.left);
            const right = this.renderAST(node.right);
            
            if (node.operator === '/') {                return `<div class="fraction">                    <div class="fraction-numerator">${left}</div>                    <div class="fraction-line"></div>                    <div class="fraction-denominator">${right}</div>                </div>`;
            } else {
                const operatorSymbol = {
                    '+': '+',
                    '-': '−',
                    '*': '×'
                }[node.operator] || node.operator;
                
                return `${left}<span class="operator">${operatorSymbol}</span>${right}`;
            }
        }
        
        return '';
    }
    
    static isSimpleExpression(node) {
        // Simple expressions that don't need parentheses:
        // 1. Single numbers
        // 2. Single fractions (binary with / operator)
        // 3. Unary minus on simple expressions
        
        if (node.type === 'number') {
            return true;
        }
        
        if (node.type === 'unary' && node.operator === '-') {
            return this.isSimpleExpression(node.operand);
        }
        
        if (node.type === 'binary' && node.operator === '/') {
            // A fraction is simple if both numerator and denominator are simple
            return this.isSimpleExpression(node.left) && this.isSimpleExpression(node.right);
        }
        
        return false;
    }
    
    static renderFraction(fraction) {
        if (fraction.isInteger()) {
            return `<span class="number">${fraction.numerator}</span>`;
        }
        
        const negativeSign = fraction.numerator < 0 ? '<span class="operator">−</span>' : '';        return `${negativeSign}<div class="fraction">            <div class="fraction-numerator">${Math.abs(fraction.numerator)}</div>            <div class="fraction-line"></div>            <div class="fraction-denominator">${fraction.denominator}</div>        </div>`;
    }
}

class FractionsVisualizer {
    constructor() {
        this.initializeElements();
        this.bindEvents();
    }
    
    initializeElements() {
        this.expressionInput = document.getElementById('expression-input');
        this.renderedExpression = document.getElementById('rendered-expression');
        this.resultDisplay = document.getElementById('result-display');
        this.decimalResult = document.getElementById('decimal-result');
        this.renderBtn = document.getElementById('render-btn');
        this.clearBtn = document.getElementById('clear-btn');
    }
    
    bindEvents() {
        this.renderBtn.addEventListener('click', () => this.renderExpression());
        this.clearBtn.addEventListener('click', () => this.clearAll());
        
        this.expressionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.renderExpression();
            }
        });
        
        // Quick action buttons
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const insert = btn.dataset.insert;
                this.insertAtCursor(insert);
            });
        });
        
        // Example buttons
        document.querySelectorAll('.example-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const example = btn.dataset.example;
                this.expressionInput.value = example;
                this.renderExpression();
            });
        });
    }
    
    insertAtCursor(text) {
        const input = this.expressionInput;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const value = input.value;
        
        input.value = value.substring(0, start) + text + value.substring(end);
        input.setSelectionRange(start + text.length, start + text.length);
        input.focus();
    }
    
    renderExpression() {
        const expression = this.expressionInput.value.trim();
        
        if (!expression) {
            this.showError('Please enter an expression');
            return;
        }
        
        try {
            // Render the visual representation
            const renderedHTML = MathRenderer.renderExpression(expression);
            this.renderedExpression.innerHTML = `<div class="math-expression">${renderedHTML}</div>`;
            
            // Calculate the result
            const parser = new ExpressionParser(expression);
            const result = parser.parse();
            
            // Display the result
            const resultHTML = MathRenderer.renderFraction(result);
            this.resultDisplay.innerHTML = `<div class="math-expression">${resultHTML}</div>`;
            
            // Show decimal approximation
            const decimal = result.toDecimal();
            this.decimalResult.textContent = `≈ ${decimal.toFixed(6)}`;
            
        } catch (error) {
            this.showError(error.message);
        }
    }
    
    showError(message) {
        this.renderedExpression.innerHTML = `<div class="placeholder error">Error: ${message}</div>`;
        this.resultDisplay.innerHTML = `<div class="placeholder">Fix the expression to see the result</div>`;
        this.decimalResult.textContent = '';
    }
    
    clearAll() {
        this.expressionInput.value = '';
        this.renderedExpression.innerHTML = '<div class="placeholder">Enter an expression to see it rendered as beautiful fractions</div>';
        this.resultDisplay.innerHTML = '<div class="placeholder">Result will appear here</div>';
        this.decimalResult.textContent = '';
        this.expressionInput.focus();
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new FractionsVisualizer();
});

// Add some CSS for error styling
const style = document.createElement('style');
style.textContent = `
    .error {
        color: #dc3545;
        font-weight: bold;
    }
    
    .placeholder.error {
        color: #dc3545;
    }
`;
document.head.appendChild(style); 