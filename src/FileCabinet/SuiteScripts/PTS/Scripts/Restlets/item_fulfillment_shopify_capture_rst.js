/**
 *@NApiVersion 2.1
 *@NModuleScope Public
 *@author Mohanraja Manickam
 *@NScriptType Restlet
 *@copyright 2025 [Prateek]**
 */

define(["SuiteScripts/pts_helper", "N/record"], function(util, record) {
  /**
   * Description placeholder
   *
   * @param {*} context
   * @author Mohanraja Manickam
   */
  function _get(context) {
    log.debug("Sdf working_22_production");
    var response = {
      status: "success",
      message: "GET request processed successfully dfg",
      data: context,
    };
    return response;
  }

  /**
   * Description placeholder
   *
   * @param {*} context
   * @author Mohanraja Manickam
   */
  function _post(context) {
    try {
      //log.debug("Sdf working_Post");
      log.debug({
        title: "Processing POST request",
        details: context,
      });

      var data = context;

      var status = data.status;

      log.debug("status", status);
      log.debug("data.status", data.status);

      const shipStatus = {
        Picked: "A",
        Packed: "B",
        Shipped: "C",
      };

      try {
        
      

      var itemFullfilmentRec = record.transform({
        fromType: "salesorder",
        fromId: data.orderId,
        toType: "itemfulfillment",
        isDynamic: true,
      });

      } catch (error) {

        log.Error("Error in transform record", error.message);  
        
      }

      if (!isNull(status)) {
        status = shipStatus[status];

        log.debug("inside if log shipStatus[status] ", shipStatus[status]);
        log.debug("inside if log status ", status);

        itemFullfilmentRec.setValue({
          fieldId: "shipstatus",
          value: status,
        });

        log.debug("getafter set", itemFullfilmentRec.getValue("shipstatus"));
      }

      var lineCount = itemFullfilmentRec.getLineCount({ sublistId: "item" });
      log.debug("SO Line Count", lineCount);

      // var apiItemIds = {};
      // data.items.forEach(function(row) {
      //   apiItemIds[row.sku] = row;
      // });

      for (var i = 0; i < lineCount; i++) {
        var soItemId = itemFullfilmentRec.getSublistValue({
          sublistId: "item",
          fieldId: "item",
          line: i,
        });

        var fulfillLines = data.items.filter((x) => x.sku == soItemId);

        if (fulfillLines.length == 0) {
          log.debug("No matching item found for SKU", soItemId);

          itemFullfilmentRec.selectLine({
            sublistId: "item",
            line: i,
          });

          itemFullfilmentRec.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "itemreceive",
            value: false,
          });

          itemFullfilmentRec.commitLine({
            sublistId: "item",
          });

          continue;
        }

        if (fulfillLines.length > 1) {
          log.error("Multiple items found for SKU", soItemId);
          throw new Error(
            "Multiple items found for SKU: " +
              soItemId +
              ". Please check the data."
          );
        }

        var apiRow = fulfillLines[0];

        log.debug("apiRow", apiRow);

        itemFullfilmentRec.selectLine({
          sublistId: "item",
          line: i,
        });

        itemFullfilmentRec.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "itemreceive",
          value: true,
        });

        // set Location explicitly (needed for Inventory Detail)
        if (!isNull(apiRow.location)) {
          itemFullfilmentRec.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "location",
            value: apiRow.location,
          });
        }

        itemFullfilmentRec.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "quantity",
          value: apiRow.qty,
        });

        var balance = getInventoryBalance(apiRow.sku, apiRow.location);

        var inventoryDetails = lotAllocation(balance, apiRow.qty);

        if (inventoryDetails.length > 0) {
          var invDetSub = itemFullfilmentRec.getCurrentSublistSubrecord({
            sublistId: "item",
            fieldId: "inventorydetail",
          });

          log.debug("inventoryDetails",inventoryDetails)
          for (var j = 0; j < inventoryDetails.length; j++) {
            var invRow = inventoryDetails[j];
            // log.debug("Inventory Row", invRow)
            invDetSub.selectNewLine({ sublistId: "inventoryassignment" });

            invDetSub.setCurrentSublistValue({
              sublistId: "inventoryassignment",
              fieldId: "issueinventorynumber",
              value: invRow.inventorynumber,
            });

            const statusId = getInventoryStatus(
              invRow.inventorynumber,
              invRow.binnumber,
              apiRow.sku,
              apiRow.location
            );

            log.debug("statusId",statusId)

            invDetSub.setCurrentSublistValue({
              sublistId: "inventoryassignment",
              fieldId: "inventorystatus",
              value: statusId || 1,
            });

            invDetSub.setCurrentSublistValue({
              sublistId: "inventoryassignment",
              fieldId: "quantity",
              value: invRow.quantity,
            });

            invDetSub.commitLine({ sublistId: "inventoryassignment" });
          }
        }

        itemFullfilmentRec.commitLine({
          sublistId: "item",
        });
      }

      var ifRecId = itemFullfilmentRec.save({
        enableSourcing: true,
        ignoreMandatoryFields: false,
      });

      log.debug("Item Fulfillment Created",ifRecId);

      return {
        success: true,
        message: "Item Fulfillment created successfully",
        internalId: ifRecId,
      };
    } catch (error) {
      var response = {
        success: false,
        message: "An error occurred while processing the POST request",
        error: error.message,
      };
      log.error("Error in Post", error);
      return response;
    }
  }

  /**
   * Description placeholder
   *
   * @param {string} item
   * @param {string} location
   * @author Mohanraja Manickam
   */
  function getInventoryBalance(item, location) {
    var inventorynumberSearch = {
      type: "inventorybalance",
      filters: [
        ["status", "anyof", "1"],
        "AND",
        [
          "formulanumeric:  NVL({available},0)-NVL({invnumcommitted},0)",
          "greaterthan",
          "0",
        ],
        "AND",
        ["item", "anyof", item],
        "AND",
        ["location", "anyof", location],
        "AND",
        ["binnumber.inactive", "is", "F"],
        "AND",
        ["inventorynumber.expirationdate", "onorafter", "today"],
      ],
      columns: [
        "item",
        "location",
        "binnumber",
        "inventorynumber",
        "status",
        "onhand",
        {
          name: "formulacurrency",
          formula: "NVL({available},0)-NVL({invnumcommitted},0)",
        },
        {
          name: "custitemnumber_suppliername",
          join: "inventoryNumber",
        },
        {
          name: "expirationdate",
          join: "inventoryNumber",
        },
      ],
    };

    var inventotyDetailResult = util.getSearch(
      inventorynumberSearch.type,
      inventorynumberSearch.filters,
      inventorynumberSearch.columns
    );

    log.debug("inventotyDetailResult", inventotyDetailResult);

    if (inventotyDetailResult.length > 0) {
      var result = sortByExpirationDate(inventotyDetailResult);
      return result;
    } else {
      return [];
    }
  }

  /**
   * Description placeholder
   *
   * @param {*} arr
   * @author Mohanraja Manickam
   */
  function sortByExpirationDate(arr) {
    return arr.sort((a, b) => {
      // Parse the dates in DD/MM/YYYY format
      if (
        a.inventoryNumber_expirationdate &&
        b.inventoryNumber_expirationdate
      ) {
        const dateA = new Date(
          a.inventoryNumber_expirationdate
            .split("/")
            .reverse()
            .join("/")
        );
        const dateB = new Date(
          b.inventoryNumber_expirationdate
            .split("/")
            .reverse()
            .join("/")
        );

        // Compare the dates
        return dateA - dateB;
      }
    });
  }

  /**
   * Description placeholder
   *
   * @param {array} inventory
   * @param {string} quantity
   * @author Mohanraja Manickam
   */
  function lotAllocation(inventory, quantity) {
    try {
      var allocation = [];

      var remainingQuantity = Number(quantity);

      for (var i = 0; i < inventory.length; i++) {
        var inventoryLot = inventory[i];

        var availableQuantity = Number(inventoryLot.formulacurrency_6);
        // log.debug("availableQuantity", availableQuantity)

        if (remainingQuantity <= 0 || availableQuantity <= 0) {
          continue;
        } // Stop if the full quantity is allocated

        var allocatedQty = Math.min(availableQuantity, remainingQuantity);

        remainingQuantity -= allocatedQty;
        allocation.push({
          item: inventoryLot.item,
          inventorynumber: inventoryLot.inventorynumber,
          inventorynumber_txt: inventoryLot.inventorynumber_txt,
          binnumber: inventoryLot.binnumber,
          binnumber_txt: inventoryLot.binnumber_txt,
          quantity: allocatedQty,
          remainingQuantity: remainingQuantity,
          status: inventoryLot.status,
        });

        availableQuantity -= allocatedQty; // Reduce the quantity in stock
        inventoryLot.formulacurrency_6 -= allocatedQty;
      }

      return allocation;
    } catch (error) {
      log.error("Error in Lot Allocation ", error);
    }
  }

  /**
   * Description placeholder
   *
   * @param {*} value
   * @author Mohanraja Manickam
   */
  function isNull(value) {
    try {
      // Check undefined, null
      if (value === undefined || value === null) return true;

      // Check string values
      if (
        typeof value === "string" &&
        (value.trim() === "" ||
          value.trim().toLowerCase() === "undefined" ||
          value.trim().toLowerCase() === "null")
      ) {
        return true;
      }

      // Check NaN
      if (typeof value === "number" && isNaN(value)) return true;

      // Check empty array
      if (Array.isArray(value) && value.length === 0) return true;

      // Check empty object
      if (
        typeof value === "object" &&
        !Array.isArray(value) &&
        Object.keys(value).length === 0
      ) {
        return true;
      }

      // All checks passed → it's valid
      return false;
    } catch (error) {
      if (typeof log !== "undefined" && typeof log.error === "function") {
        log.error({
          title: `Validation Error on value`,
          details: error.message,
        });
      } else {
        console.error(`Validation error for:`, value, "→", error.message);
      }
      return true;
    }
  }

  /**
   * Description placeholder
   *
   * @param {*} itemId
   * @param {*} inventoryNumberId
   * @param {*} locationId
   * @author Mohanraja Manickam
   */
  function getInventoryStatus(inventoryNumberId,binId, itemId, locationId) {
    try {
      var statusId = "";
      log.debug("inventoryNumberId-->getInventoryStatus", inventoryNumberId);
       log.debug("binId-->getInventoryStatus", binId);
      log.debug("locationId-->getInventoryStatus", locationId);
      log.debug("itemId-->getInventoryStatus", itemId);

      const invStatusSearch = {
        type: "inventorybalance",
        filters: [
          ["item", "anyof", itemId],
          "AND",
          ["location", "anyof", locationId],
        ],
        columns: [
          "item",
          "location",
          "binnumber",
          "inventorynumber",
          "status",
          "onhand",
        ],
      };

      const resultSet = util.getSearch(
        invStatusSearch.type,
        invStatusSearch.filters,
        invStatusSearch.columns
      );

      log.debug("resultSet", resultSet);

      if (resultSet && resultSet.length > 0) {
        for (var i of resultSet) {
          if (i.inventorynumber == inventoryNumberId && i.binnumber == binId) {
            const statusField = i.status;
            if (statusField) {
              statusId = statusField;
            }
          }
        }
      }

      log.debug("statusId", statusId);

      return statusId;
    } catch (error) {
      log.error("Error in getInventoryStatus", error.message);
    }
  }

  return {
    get: _get,
    post: _post,
  };
});