/*can-route@3.0.0-pre.1#can-route*/
define(function (require, exports, module) {
    var canBatch = require('can-event/batch');
    var canEvent = require('can-event');
    var ObserveInfo = require('can-observe-info');
    var compute = require('can-compute');
    var deparam = require('can-util/js/deparam');
    var each = require('can-util/js/each');
    var string = require('can-util/js/string');
    var isFunction = require('can-util/js/is-function');
    var param = require('can-util/js/param');
    var isEmptyObject = require('can-util/js/is-empty-object');
    var deepAssign = require('can-util/js/deep-extend');
    var isWebWorker = require('can-util/js/is-web-worker');
    var isBrowserWindow = require('can-util/js/is-browser-window');
    var makeArray = require('can-util/js/make-array');
    var assign = require('can-util/js/assign');
    var types = require('can-util/js/types');
    var matcher = /\:([\w\.]+)/g;
    var paramsMatcher = /^(?:&[^=]+=[^&]*)+/;
    var makeProps = function (props) {
        var tags = [];
        each(props, function (val, name) {
            tags.push((name === 'className' ? 'class' : name) + '="' + (name === 'href' ? val : string.esc(val)) + '"');
        });
        return tags.join(' ');
    };
    var matchesData = function (route, data) {
        var count = 0, i = 0, defaults = {};
        for (var name in route.defaults) {
            if (route.defaults[name] === data[name]) {
                defaults[name] = 1;
                count++;
            }
        }
        for (; i < route.names.length; i++) {
            if (!data.hasOwnProperty(route.names[i])) {
                return -1;
            }
            if (!defaults[route.names[i]]) {
                count++;
            }
        }
        return count;
    };
    var location = typeof window !== 'undefined' ? window.location : {};
    var wrapQuote = function (str) {
        return (str + '').replace(/([.?*+\^$\[\]\\(){}|\-])/g, '\\$1');
    };
    var stringify = function (obj) {
        if (obj && typeof obj === 'object') {
            if (obj && typeof obj === 'object' && 'serialize' in obj) {
                obj = obj.serialize();
            } else {
                obj = isFunction(obj.slice) ? obj.slice() : assign({}, obj);
            }
            each(obj, function (val, prop) {
                obj[prop] = stringify(val);
            });
        } else if (obj !== undefined && obj !== null && isFunction(obj.toString)) {
            obj = obj.toString();
        }
        return obj;
    };
    var removeBackslash = function (str) {
        return str.replace(/\\/g, '');
    };
    var timer;
    var curParams;
    var lastHash;
    var changingData;
    var changedAttrs = [];
    var eventsObject = assign({}, canEvent);
    var canRoute = function (url, defaults) {
        var root = canRoute._call('root');
        if (root.lastIndexOf('/') === root.length - 1 && url.indexOf('/') === 0) {
            url = url.substr(1);
        }
        defaults = defaults || {};
        var names = [], res, test = '', lastIndex = matcher.lastIndex = 0, next, querySeparator = canRoute._call('querySeparator'), matchSlashes = canRoute._call('matchSlashes');
        while (res = matcher.exec(url)) {
            names.push(res[1]);
            test += removeBackslash(url.substring(lastIndex, matcher.lastIndex - res[0].length));
            next = '\\' + (removeBackslash(url.substr(matcher.lastIndex, 1)) || querySeparator + (matchSlashes ? '' : '|/'));
            test += '([^' + next + ']' + (defaults[res[1]] ? '*' : '+') + ')';
            lastIndex = matcher.lastIndex;
        }
        test += url.substr(lastIndex).replace('\\', '');
        canRoute.routes[url] = {
            test: new RegExp('^' + test + '($|' + wrapQuote(querySeparator) + ')'),
            route: url,
            names: names,
            defaults: defaults,
            length: url.split('/').length
        };
        return canRoute;
    };
    var oldProperties = null;
    var onRouteDataChange = function (ev, newProps, oldProps) {
        changingData = 1;
        if (!oldProperties) {
            oldProperties = oldProps;
        }
        clearTimeout(timer);
        timer = setTimeout(function () {
            var old = oldProperties;
            oldProperties = null;
            changingData = 0;
            var serialized = canRoute.data.serialize(), path = canRoute.param(serialized, true);
            canRoute._call('setURL', path, newProps, old);
            canBatch.trigger(eventsObject, '__url', [
                path,
                lastHash
            ]);
            lastHash = path;
            changedAttrs = [];
        }, 10);
    };
    var stringCoercingMapDecorator = function (map) {
        var attrSuper = map.attr;
        map.attr = function (prop, val) {
            var serializable = this.define === undefined || this.define[prop] === undefined || !!this.define[prop].serialize, args;
            if (serializable) {
                args = stringify(Array.apply(null, arguments));
            } else {
                args = arguments;
            }
            return attrSuper.apply(this, args);
        };
        return map;
    };
    var recursiveClean = function (old, cur, data) {
        for (var attr in old) {
            if (cur[attr] === undefined) {
                if ('removeAttr' in data) {
                    data.removeAttr(attr);
                } else {
                    cur[attr] = undefined;
                }
            } else if (Object.prototype.toString.call(old[attr]) === '[object Object]') {
                recursiveClean(old[attr], cur[attr], data.attr(attr));
            }
        }
    };
    var setState = canRoute.setState = function () {
        var hash = canRoute._call('matchingPartOfURL');
        var oldParams = curParams;
        curParams = canRoute.deparam(hash);
        if (!changingData || hash !== lastHash) {
            canRoute.batch.start();
            recursiveClean(oldParams, curParams, canRoute.data);
            canRoute.attr(curParams);
            canRoute.batch.trigger.call(eventsObject, '__url', [
                hash,
                lastHash
            ]);
            canRoute.batch.stop();
        }
    };
    assign(canRoute, {
        param: function (data, _setRoute) {
            var route, matches = 0, matchCount, routeName = data.route, propCount = 0;
            delete data.route;
            each(data, function () {
                propCount++;
            });
            each(canRoute.routes, function (temp, name) {
                matchCount = matchesData(temp, data);
                if (matchCount > matches) {
                    route = temp;
                    matches = matchCount;
                }
                if (matchCount >= propCount) {
                    return false;
                }
            });
            if (canRoute.routes[routeName] && matchesData(canRoute.routes[routeName], data) === matches) {
                route = canRoute.routes[routeName];
            }
            if (route) {
                var cpy = assign({}, data), res = route.route.replace(matcher, function (whole, name) {
                        delete cpy[name];
                        return data[name] === route.defaults[name] ? '' : encodeURIComponent(data[name]);
                    }).replace('\\', ''), after;
                each(route.defaults, function (val, name) {
                    if (cpy[name] === val) {
                        delete cpy[name];
                    }
                });
                after = param(cpy);
                if (_setRoute) {
                    canRoute.attr('route', route.route);
                }
                return res + (after ? canRoute._call('querySeparator') + after : '');
            }
            return isEmptyObject(data) ? '' : canRoute._call('querySeparator') + param(data);
        },
        deparam: function (url) {
            var root = canRoute._call('root');
            if (root.lastIndexOf('/') === root.length - 1 && url.indexOf('/') === 0) {
                url = url.substr(1);
            }
            var route = { length: -1 }, querySeparator = canRoute._call('querySeparator'), paramsMatcher = canRoute._call('paramsMatcher');
            each(canRoute.routes, function (temp, name) {
                if (temp.test.test(url) && temp.length > route.length) {
                    route = temp;
                }
            });
            if (route.length > -1) {
                var parts = url.match(route.test), start = parts.shift(), remainder = url.substr(start.length - (parts[parts.length - 1] === querySeparator ? 1 : 0)), obj = remainder && paramsMatcher.test(remainder) ? deparam(remainder.slice(1)) : {};
                obj = deepAssign(true, {}, route.defaults, obj);
                each(parts, function (part, i) {
                    if (part && part !== querySeparator) {
                        obj[route.names[i]] = decodeURIComponent(part);
                    }
                });
                obj.route = route.route;
                return obj;
            }
            if (url.charAt(0) !== querySeparator) {
                url = querySeparator + url;
            }
            return paramsMatcher.test(url) ? deparam(url.slice(1)) : {};
        },
        map: function (data) {
            canRoute.data = data;
        },
        routes: {},
        ready: function (val) {
            if (val !== true) {
                canRoute._setup();
                if (isBrowserWindow() || isWebWorker()) {
                    canRoute.setState();
                }
            }
            return canRoute;
        },
        url: function (options, merge) {
            if (merge) {
                ObserveInfo.observe(eventsObject, '__url');
                options = assign({}, canRoute.deparam(canRoute._call('matchingPartOfURL')), options);
            }
            return canRoute._call('root') + canRoute.param(options);
        },
        link: function (name, options, props, merge) {
            return '<a ' + makeProps(assign({ href: canRoute.url(options, merge) }, props)) + '>' + name + '</a>';
        },
        current: function (options) {
            ObserveInfo.observe(eventsObject, '__url');
            return this._call('matchingPartOfURL') === canRoute.param(options);
        },
        bindings: {
            hashchange: {
                paramsMatcher: paramsMatcher,
                querySeparator: '&',
                matchSlashes: false,
                bind: function () {
                    canEvent.on.call(window, 'hashchange', setState);
                },
                unbind: function () {
                    canEvent.on.call(window, 'hashchange', setState);
                },
                matchingPartOfURL: function () {
                    var loc = canRoute.location || location;
                    return loc.href.split(/#!?/)[1] || '';
                },
                setURL: function (path) {
                    if (location.hash !== '#' + path) {
                        location.hash = '!' + path;
                    }
                    return path;
                },
                root: '#!'
            }
        },
        defaultBinding: 'hashchange',
        currentBinding: null,
        _setup: function () {
            if (!canRoute.currentBinding) {
                canRoute._call('bind');
                canRoute.serializedCompute.addEventListener('change', onRouteDataChange);
                canRoute.currentBinding = canRoute.defaultBinding;
            }
        },
        _teardown: function () {
            if (canRoute.currentBinding) {
                canRoute._call('unbind');
                canRoute.serializedCompute.removeEventListener('change', onRouteDataChange);
                canRoute.currentBinding = null;
            }
            clearTimeout(timer);
            changingData = 0;
        },
        _call: function () {
            var args = makeArray(arguments), prop = args.shift(), binding = canRoute.bindings[canRoute.currentBinding || canRoute.defaultBinding], method = binding[prop];
            if (method.apply) {
                return method.apply(binding, args);
            } else {
                return method;
            }
        }
    });
    each([
        'addEventListener',
        'removeEventListener',
        'bind',
        'unbind',
        'on',
        'off',
        'delegate',
        'undelegate',
        'removeAttr',
        'compute',
        '_get',
        '___get',
        'each'
    ], function (name) {
        canRoute[name] = function () {
            if (!canRoute.data[name]) {
                return;
            }
            return canRoute.data[name].apply(canRoute.data, arguments);
        };
    });
    var routeData;
    var setRouteData = function (data) {
        routeData = data;
        return routeData;
    };
    var serializedCompute;
    Object.defineProperty(canRoute, 'serializedCompute', {
        get: function () {
            if (!serializedCompute) {
                serializedCompute = compute(function () {
                    return canRoute.data.serialize();
                });
            }
            return serializedCompute;
        }
    });
    Object.defineProperty(canRoute, 'data', {
        get: function () {
            if (routeData) {
                return routeData;
            } else if (types.DefaultMap) {
                if (types.DefaultMap.prototype.toObject) {
                    var DefaultRouteMap = types.DefaultMap.extend({ seal: false }, { '*': { type: 'string' } });
                    return setRouteData(new DefaultRouteMap());
                } else {
                    return setRouteData(stringCoercingMapDecorator(new types.DefaultMap()));
                }
            } else {
                throw new Error('can.route.data accessed without being set');
            }
        },
        set: function (data) {
            if (types.isConstructor(data)) {
                data = new data();
            }
            if ('attr' in data) {
                setRouteData(stringCoercingMapDecorator(data));
            } else {
                setRouteData(data);
            }
        }
    });
    canRoute.attr = function (prop, value) {
        if ('attr' in canRoute.data) {
            return canRoute.data.attr.apply(canRoute.data, arguments);
        } else {
            if (arguments.length > 1) {
                canRoute.data.set(prop, value);
                return canRoute.data;
            } else if (typeof prop === 'object') {
                canRoute.data.set(prop);
                return canRoute.data;
            } else if (arguments.length === 1) {
                return canRoute.data.get(prop);
            } else {
                return canRoute.data.toObject();
            }
        }
    };
    canRoute.batch = canBatch;
    var oldIsCallableForValue = types.isCallableForValue;
    types.isCallableForValue = function (obj) {
        if (obj === canRoute) {
            return false;
        } else {
            return oldIsCallableForValue.call(this, obj);
        }
    };
    module.exports = canRoute;
});