
var testsContext = require.context('./test', true, /\.spec\.ts/);
testsContext.keys().forEach(testsContext);
