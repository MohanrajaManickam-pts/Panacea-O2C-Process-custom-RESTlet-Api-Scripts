// pts_helper.test.js

import record from 'N/record';
import Record from 'N/record/instance';

jest.mock('N/record');
jest.mock('N/record/instance');


jest.mock("N/search", () => ({
    create: jest.fn(),
}));

const search = require("N/search");
const ptsHelper = require("../src/FileCabinet/SuiteScripts/PTS/Libraries/pts_helper"); // Adjust path as needed



describe("pts_helper module", () => {
    describe("groupBy", () => {
        it("groups array by key", () => {
            const data = [
                { type: "a", value: 1 },
                { type: "b", value: 2 },
                { type: "a", value: 3 }
            ];
            const grouped = ptsHelper.groupBy(data, "type");
            expect(grouped).toEqual({
                a: [{ type: "a", value: 1 }, { type: "a", value: 3 }],
                b: [{ type: "b", value: 2 }]
            });
        });
    });

    describe("sum", () => {
        it("sums array of numbers", () => {
            expect(ptsHelper.sum([1, 2, 3,])).toBe(6);
        });

        it("sums values by key", () => {
            const data = [{ v: "1" }, { v: "2.5" }, { v: "3.5" }];
            expect(ptsHelper.sum(data, "v")).toBe(7);
        });

        it("sums values from object with keys", () => {
            const obj = { a: 2, b: 3, c: 5 };
            expect(ptsHelper.sum(obj, ["a", "b"])).toBe(5);
        });
    });

    describe("toNum", () => {
        it("converts valid string to number", () => {
            expect(ptsHelper.toNum("42")).toBe(42);
        });

        it("returns 0 for invalid number string", () => {
            expect(ptsHelper.toNum("abc")).toBe(0);
        });
    });

    describe("pick", () => {
        it("picks values from array of objects", () => {
            ``
            const input = [{ a: 1 }, { a: 2 }];
            expect(ptsHelper.pick(input, "a")).toEqual([1, 2]);
        });

        it("picks keys from object", () => {
            const input = { a: 1, b: 2 };
            expect(ptsHelper.pick(input, ["a", "b"])).toEqual([1, 2]);
        });
    });

    describe("unique", () => {
        it("removes duplicates by value", () => {
            expect(ptsHelper.unique([1, 2, 2, 3])).toEqual([1, 2, 3]);
        });

        it("removes duplicates by key", () => {
            const data = [{ id: 1 }, { id: 2 }, { id: 1 }];
            expect(ptsHelper.unique(data, "id")).toEqual([{ id: 1 }, { id: 2 }]);
        });
    });

    describe("removeNullOrDefault", () => {
        it("filters out null/undefined/empty values", () => {
            expect(ptsHelper.removeNullOrDefault([0, "", null, undefined, 5])).toEqual([0, 5]);
        });
    });

    describe("isNullorDefault", () => {
        it("returns true for null/undefined/empty string", () => {
            expect(ptsHelper.isNullorDefault(null)).toBe(true);
            expect(ptsHelper.isNullorDefault(undefined)).toBe(true);
            expect(ptsHelper.isNullorDefault("")).toBe(true);
        });


    });

    describe("isObjectChanged", () => {
        it("detects object changes", () => {
            const obj1 = { a: 1, b: 2 };
            const obj2 = { a: 1, b: 3 };
            expect(ptsHelper.isObjectChanged(obj1, obj2)).toBe(true);
        });

        it("returns false for identical objects", () => {
            const obj = { a: 1, b: 2 };
            expect(ptsHelper.isObjectChanged(obj, obj)).toBe(false);
        });
    });
});
