const Tag = require('./dist/index');
console.log(new Tag.Runtime(Tag.interpretTemplateString('123 {randomNum}')).start())