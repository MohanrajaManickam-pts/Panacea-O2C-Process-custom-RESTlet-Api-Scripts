// 9) AMOUNT CALC
var amount = quantity * rate;
amount = parseFloat(amount.toFixed(2));
amountTotal += amount;

// 10) GST %
var gstPercent = 0;

// Pick GST % from table
if (hsnTaxCode && gstRateByHsn.hasOwnProperty(hsnTaxCode)) {
    gstPercent = gstRateByHsn[hsnTaxCode] || 0;
}

/*
-------------------------------
 FIX: IGST must be FULL % 
 If rate table is CGST rate (half), multiply by 2
-------------------------------
*/
var isInterState = (fromState && toState && fromState !== toState);

if (isInterState) {
    gstPercent = gstPercent * 2;     // IGST = full GST% (e.g., 18%)
}

// TAX AMOUNT
var taxAmount = (gstPercent * amount) / 100;
taxAmount = parseFloat(taxAmount.toFixed(2));
taxAmountTotal += taxAmount;

// GROSS
var grossAmount = amount + taxAmount;
grossAmount = parseFloat(grossAmount.toFixed(2));
grossAmountTotal += grossAmount;

// ----------------------------
// 11) LINE-LEVEL TAX SPLIT
// ----------------------------

var lineCGST = 0;
var lineSGST = 0;
var lineIGST = 0;

if (!isInterState) {
    //-----------------------------
    // INTRA-STATE: CGST + SGST
    //-----------------------------
    lineCGST = taxAmount / 2;
    lineSGST = taxAmount / 2;

    lineCGST = parseFloat(lineCGST.toFixed(2));
    lineSGST = parseFloat(lineSGST.toFixed(2));

    cgstTotal += lineCGST;
    sgstTotal += lineSGST;

    // Set line-level
    newRec.setSublistValue({ sublistId: 'item', fieldId: 'custcol_cgst_amount', line: i, value: lineCGST });
    newRec.setSublistValue({ sublistId: 'item', fieldId: 'custcol_sgst_amount', line: i, value: lineSGST });
    newRec.setSublistValue({ sublistId: 'item', fieldId: 'custcol_igst_amount', line: i, value: 0 });

} else {
    //-----------------------------
    // INTER-STATE: IGST ONLY
    //-----------------------------
    lineIGST = taxAmount;
    lineIGST = parseFloat(lineIGST.toFixed(2));

    igstTotal += lineIGST;

    newRec.setSublistValue({ sublistId: 'item', fieldId: 'custcol_igst_amount', line: i, value: lineIGST });
    newRec.setSublistValue({ sublistId: 'item', fieldId: 'custcol_cgst_amount', line: i, value: 0 });
    newRec.setSublistValue({ sublistId: 'item', fieldId: 'custcol_sgst_amount', line: i, value: 0 });
}

// 12) SET OTHER LINE VALUES
newRec.setSublistValue({ sublistId: 'item', fieldId: 'custcol_rate_to', line: i, value: rate });
newRec.setSublistValue({ sublistId: 'item', fieldId: 'custcol_amount_to', line: i, value: amount });
newRec.setSublistValue({ sublistId: 'item', fieldId: 'custcol_tax_amount_to', line: i, value: taxAmount });
newRec.setSublistValue({ sublistId: 'item', fieldId: 'custcol_item_gross_amount_to', line: i, value: grossAmount });
newRec.setSublistValue({ sublistId: 'item', fieldId: 'custcol_gst_tax_rate_to', line: i, value: gstPercent });
