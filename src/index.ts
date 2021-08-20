/**
 * CherryPick Entry Point!
 */

Error.stackTraceLimit = Infinity;

require('events').EventEmitter.defaultMaxListeners = 128;

import boot from './boot/index';

export default function() {
	return boot();
}
