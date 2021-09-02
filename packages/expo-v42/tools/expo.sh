#!/bin/bash

# 'max-old-space-size'
#   Otherwise we get out of memory errors.
#   See: https://forums.expo.io/t/javascript-heap-out-of-memory/29103/7

NODE_OPTIONS=--max-old-space-size=8192 expo "$@"
