#!/usr/bin/env node

import {equal, deepEqual} from 'assert';
import rsend from './index.js';

const expected = true;
// should be disabled for safety
const actual = await rsend('test', 'earth:/tmp/rsend-test');
equal(actual, expected);
