/**
 * All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @NApiVersion 2.1
 * @NScriptType Helper
 * @NModuleScope Public
 * @author sathish
 * @copyright 2025 [Prateek]
 */
define(["N/search","N/log"], function (search,log) {

    /**
     * Description placeholder
     *
     * @param {Array} xs
     * @param {String} key
     * @returns {Object}
     * @author sathish.a@prateektechnosoft.com
     */
    function groupBy(xs, key) {
        return xs.reduce(function (rv, x) {
            (rv[x[key]] = rv[x[key]] || []).push(x)
            return rv
        }, {})
    }
    

    /**
     * Description placeholder
     *
     * @param {Array} arr
     * @param {string} k
     * @returns {number}
     * @author sathish.a@prateektechnosoft.com
     */
    function sum(arr, k) {
        if (Array.isArray(arr)) {

            var ar
            if (k)
                ar = arr.map(function (x) {
                    return toNum(x[k])
                })
            else ar = arr

            return ar.reduce(function (a, b) {
                return a + b
            }, 0)


        } else if (Array.isArray(k) && typeof arr === "object") {
            var values = k.map(function (c) {
                return arr[c]
            })
            return sum(values)
        }
    }
  
    /**
     * Description placeholder
     *
     * @param {string} s
     * @returns {Number}
     * @author sathish.a@prateektechnosoft.com
     */
    function toNum(s) {
        s = parseFloat(s)
        if (isNaN(s))
            return 0
        else
            return s
    }

    /**
     * Description placeholder
     *
     * @param {*} type
     * @param {*} filters
     * @param {*} columns
     * @returns {{}}
     * @author sathish.a@prateektechnosoft.com
     */
    function getSearch(type, filters, columns) {
        try {
            var dynamicSearch
            if (typeof type === "string" || type instanceof String) {
                dynamicSearch = search.create({
                    type: type,
                    filters: filters,
                    columns: columns
                });

            } else {
                dynamicSearch = type
                columns = JSON.parse(JSON.stringify(dynamicSearch)).columns
            }

            var resultOut = [];
            var myPagedData = dynamicSearch.runPaged({ pageSize: 1000 });
            myPagedData.pageRanges.forEach(function (pageRange) {
                var myPage = myPagedData.fetch({
                    index: pageRange.index
                });
                myPage.data.forEach(function (res) {
                    var values = {
                        id: res.id

                    };
                    //iterate over the collection of columns for the value
                    columns.forEach(function (c, i) {

                        var keyName = "";

                        if (c.join)
                            keyName = c.join + "_" + c.name
                        else if (c.name.indexOf("formula") > -1)
                            keyName = c.name + "_" + i
                        else
                            keyName = c.name;

                        var value = res.getText(c);

                        if (value == null) {
                            values[keyName] = res.getValue(c);
                        } else {

                            values[keyName] = res.getValue(c);

                            values[keyName + "_txt"] = res.getText(c);
                        }
                    });
                    resultOut.push(values);
                });
            });
            return resultOut;
        }
        catch (e) {
            log.error("getSearch failed due to an exception", e);
        }
    }

    /**
     * Description placeholder
     *
     * @param {*} currentRecord
     * @param {*} sublist
     * @author sathish.a@prateektechnosoft.com
     */
    function removeLines(currentRecord, sublist) {
        while (currentRecord.getLineCount(sublist) > 0) {
            currentRecord.removeLine({
                sublistId: sublist,
                line: 0
            });
        }
    }

    /**
     * Description placeholder
     *
     * @param {*} rec
     * @param {*} sublist
     * @param {*} cols
     * @returns {{}}
     * @author sathish.a@prateektechnosoft.com
     */
    function getLines(rec, sublist, cols) {
        var result = [];
        var lineCount = rec.getLineCount(sublist);
        for (var i = 0; i < lineCount; i++) {
            var row = {};
            for (var j = 0; j < cols.length; j++) {
                try {
                    row[cols[j]] = rec.getSublistValue({
                        fieldId: cols[j],
                        sublistId: sublist,
                        line: i
                    })
                } catch (e) {
                    log.error("getLines:getSublistValue failed", e)
                }
                try {
                    row[cols[j] + "_txt"] = rec.getSublistText({
                        fieldId: cols[j],
                        sublistId: sublist,
                        line: i
                    })

                } catch (e) {
                    log.error("getLines:getSublistText failed", e)
                }
            }
            result.push(row)
        }
        return result;
    }

    /**
     * Description placeholder
     *
     * @param {Array} arrobj
     * @param {string} key
     * @returns {Number}
     * @author sathish.a@prateektechnosoft.com
     */
    function pick(arrobj, key) {

        if (Array.isArray(arrobj) && typeof key === "string") {
            return arrobj.map(function (c) {
                return c[key]
            })
        } else if (Array.isArray(key) && typeof arrobj === "object") {
            return key.map(function (c) {
                return arrobj[c]
            })
        }
    }

    /**
     * Description placeholder
     *
     * @param {Array} arr
     * @param {String} key
     * @returns {Array}
     * @author sathish.a@prateektechnosoft.com
     */
    function unique(arr, key) {
        if (key) {
            return arr.filter(function (c, i, a) {
                var list = a.map(function (x) {
                    return x[key]
                })
                if (list.indexOf(c[key]) == i)
                    return c
            })
        } else {
            return arr.filter(function (c, i, a) {
                if (a.indexOf(c) == i)
                    return c
            })
        }
    }

    /**
     * Description placeholder
     *
     * @param {Array} arr
     * @returns {Array}
     * @author sathish.a@prateektechnosoft.com
     */
    function removeNullOrDefault(arr) {
        return arr.filter(function (c) {
            return c !== null && c !== undefined && c !== ""
        })
    }

    /**
     * Description placeholder
     *
     * @param {*} s
     * @returns {boolean}
     * @author sathish.a@prateektechnosoft.com
     */
    function isNullorDefault(s) {
        if (s == undefined || s == null || s == "")
            return true
        else
            return false
    }

    /**
     * Description placeholder
     *
     * @param {Object} obj1
     * @param {Object} obj2
     * @returns {boolean}
     * @author sathish.a@prateektechnosoft.com
     *
     */
    function isObjectChanged(obj1, obj2) {
        var isChanged = false
        if (!isNullorDefault(obj1) && !isNullorDefault(obj2)) {
            var keys = Object.keys(obj1)
            var values = keys.map(function (c) {
                return {
                    lhs: obj1[c],
                    rhs: obj2[c]
                }
            })

            var res = values.filter(function (c) {
                if (c.lhs != c.rhs) {
                    return c
                }
            })

            if (res.length > 0) {
                isChanged = true
            }
        }
        return isChanged
    }

    return {
        groupBy: groupBy,
        sum: sum,
        toNum: toNum,
        getSearch: getSearch,
        removeLines: removeLines,
        getLines: getLines,
        isObjectChanged: isObjectChanged,
        isNullorDefault: isNullorDefault,
        removeNullOrDefault: removeNullOrDefault,
        unique: unique,
        pick: pick
    }
})
