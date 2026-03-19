/**
 * Auto-detect programming language from code content.
 * Used by ChatArea (before sending) and MessageItem (for display).
 * @param {string} code - The code string to analyze
 * @param {string} [hint] - Optional stored codeLanguage from the message
 * @returns {string} language identifier for react-syntax-highlighter
 */
const detectLanguage = (code, hint = '') => {
    if (hint) return hint

    if (/\b(def |import |from |print\(|if __name__|elif |lambda )/.test(code)) return 'python'
    if (/\b(const |let |var |function |=>|console\.|require\(|export )/.test(code)) return 'javascript'
    if (/\b(interface |type |: string|: number|: boolean)/.test(code)) return 'typescript'
    if (/\b(public class|public static void|System\.out|private |protected )/.test(code)) return 'java'
    if (/\b(#include|int main|printf\(|scanf\(|void \*)/.test(code)) return 'c'
    if (/\b(std::|cout|cin|namespace )/.test(code)) return 'cpp'
    if (/\b(using System|namespace |Console\.Write)/.test(code)) return 'csharp'
    if (/\b(package main|func |fmt\.)/.test(code)) return 'go'
    if (/\b(fn |let mut|impl |pub fn|println!)/.test(code)) return 'rust'
    if (/\b(def |end$|puts |require ')/.test(code)) return 'ruby'
    if (/\b(SELECT |FROM |WHERE |INSERT INTO|CREATE TABLE)/.test(code)) return 'sql'
    if (/section \.|mov |syscall|global _start|eax|ebx|rax|rdi/.test(code)) return 'nasm'
    if (/#!.*\b(bash|sh)\b|echo |sudo |apt |npm run/.test(code)) return 'bash'
    return 'text'
}

export default detectLanguage
