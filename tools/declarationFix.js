const { cleanDtsSync } = require('../bin/index');

cleanDtsSync({
    file: 'bin/index.d.ts',
    all: 'clean-dts'
})
