import {createRequire} from 'node:module';
import {adapt} from '../../src/edgeone/adapter.mjs';
const require=createRequire(import.meta.url);
const handler=adapt(require('../../legacy-api/export.cjs'));
export default function onRequest(context){return handler(context);}
