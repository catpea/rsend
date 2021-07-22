#!/usr/bin/env node

import {equal, deepEqual} from 'assert';
import rsend from './index.js';

const expected = true;
const actual = await rsend('test', 'earth:/tmp');
equal(actual, expected);
