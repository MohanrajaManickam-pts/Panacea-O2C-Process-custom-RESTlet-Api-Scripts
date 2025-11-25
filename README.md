# Latent View
 
### NetSuite Account Customization Project
 
This repository contains code for netsuite account customization scripting report and prints done prateek technosoft.
 
### Prerequisities
 
* Node js v22.14.0 installed (- [Download](https://nodejs.org/zh-cn/download) - )
* SuiteCloud Installed (- [Instruction Here](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_155929845760.html)-)
* Github Desktop Installed (-[Download](https://desktop.github.com/download/)-)
* Git installed (-[Instruction Here](https://git-scm.com/downloads/win)-)
* Visual Studio code (-[Download](https://code.visualstudio.com/download)-)
 
### Getting Started
 
### Method (Using Github Desktop-Windows)
 
* Open Code Dropdown button
* Select the option "Open with github Desktop"
* Allow the popup to open the Github Desktop application in windows
* Click on open with visual studio code to get started
 
## Installation
 
Code requires [Node.js](https://nodejs.org/) v22.14.0 to run.
 
Install the dependencies and devDependencies and start the server .
 
```sh
cd <projectname>
npm install
npm start lint //to run the linter
npm start test //to run the tests
npm start scan-xml // to run the scan-xml
suitecloud deploy //to deploy into account
```

## For uat environments...
 
* Raise a merge request to uat branch from the feature branch
* Get the request approved by the maintainer
* Your feature will be merged to uat and ready for uat.
 
## For Prod Environments...
 
* uat branch with the newly added features will be merged on main branch.

## Linting Test – ESLint Rules
 
* **Purpose**: Validates code based on defined ESLint rules.
 
* **Key Rules Checked:**
      
  * **Environment**: browser, commonjs, es2021, amd
  * **Extends**: eslint:recommended
  * **Parser Option**: ecmaVersion: latest
 
* **Custom Rules**:
  - **indent** : off (tab-based indentation)
  - **linebreak-style** : off (Unix-style)
  - **quotes** : warn on single quotes (expects double quotes)
  - **semi** : off (semicolons optional)
  - **camelcase** : error if object property names are not in camelCase

* **Example**:

    - **Valid** : var testString = "memo"; 
    - **Invalid** : var test_string = 'memo';

## Predefined Tests
 
  > For testing purpose list of predefined tests are given below. 
* **header-test** - Checks description comments of Scripts and Functions
* **case-test**  - Variable Naming Convention
* **fieldId-test** - Field Id Prefix Validation 
* **util-test** - Helper Module Tests
* **scan-xml** - Empty XML tag scanner

### 1. **header-test** – **Checks header comments of Scripts and Functions**
 
* **Purpose**: Ensures that header contains 
    - JsDoc style header
    - @author 
    - @NAPI Version
    - @NScriptType
* **Example**:
  * **Valid** : /**
  @NApiVersion 2.1
  @NScriptType UserEventScript
  @NModuleScope Public
  @author sathish
  @copyright 2025 [Prateek]
 */
  * **Invalid** : /**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */

* **Errors**:
   * For JsDoc style header - `::error file=${oFile.name},line=1::Each NetSuite script should have a valid JsDoc style header` 
   * For @author - `::error file=${oFile.name},line=1::Script JsDoc header should contain an @author`
   * For @NApiVersion - `::error file=${oFile.name}::Script JsDoc header should contain a valid @NApiVersion pragma`
   * For @NScriptType - `::error file=${oFile.name},line=1::The NScriptType pragma must contain a valid script type`
    
 
---
### 2. **case-test** – **Variable Naming Convention**
 
* **Purpose**: Ensures that variable names follow either **camelCase** or **ALL_CAPS** (for constants).
* **Example**:
  * **Valid** : let myVariable = 5; , const MAX_LIMIT = 100;
  * **Invalid** : let my_variable = 5;, const Max_Limit = 100;
 
---
 
### 3. **fieldId-test** – **Field ID Prefix Validation**
 
* **Purpose**: Checks that *fieldId* values used in *setValue()* follow allowed prefixes.
* **Allowed Prefixes**:
     - 'custscript_pts_'
     - 'custbody_pts_'
     - 'custcol_pts_'
     - 'custrecord_pts_'
     - 'custbody_'
* **Example**:
  * **Valid** : fieldId: 'custbody_pts_projectId'
  * **Invalid** : fieldId : 'custom_field'
 
---
 
### 4. **util-test** – **Helper Utility Tests**
 
* **Purpose**: Unit tests for utility functions in **pts_helper** module.

---
 
### 4. **scan-xml** – **Empty XML Tag Scanner**
 
* **Purpose**: Scans **.xml** files in **src/Objects/** for empty **<description>** tags and reports them.
* **Example Warning**:
  * `::error file=MyFile.xml,line=12::Empty <description> element found, please update DESCRIPTION tag for proper documentation.`

---

### 5. **jsdoc-test** - **Checks for valid jsdoc style header**

* **Purpose** : Checks jsdoc header style with @param, @author and @returns tag 
* **Example Warning** :
   * ` Function <functionName> is missing JSDoc or required tags (@param, @author, @returns) [expects 1 @param tags].`