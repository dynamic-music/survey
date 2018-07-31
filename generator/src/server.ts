import * as express from 'express';

export const PORT = '4111';
export const SERVER_PATH = 'http://localhost:' + PORT + '/';

var app = express();
app.use(express["static"](__dirname+'/../../'));
var server = app.listen(PORT);
console.log('server started at '+SERVER_PATH);
