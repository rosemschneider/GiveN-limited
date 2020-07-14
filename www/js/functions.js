var domReady = false;
var backendServletURL = '192.168.0.100:3000';//'http://localhost:8084/GiveN-App-Backend/Collect';//;//'http://192.168.1.103:8084/GiveN-App-Backend/Collect'//'http://number.ucsd.edu:8080/GiveN-App-Backend/Collect';//'http://localhost:8084/GiveN-App-Backend/Collect';
var nonTitratedSet = null;

$().ready(function () {
    domReady = true;
    //giveN.loadSettings(document.forms[0]);
    $.mobile.defaultPageTransition = 'slide';

    setInterval(giveN.updateQueueStatus, 1000);
});
/*
$(document).on('pagehide', 'div', function (event, ui) {
    if (ui.nextPage && ui.nextPage[0] && $(ui.nextPage[0]).is('.ui-dialog')) return;
    var page = jQuery(event.target);

    if (page.attr('data-cache') == 'never') {
        page.remove();
    };
});*/


$(document).bind('pagecontainershow', function (e, ui) {
    //if (domReady) {
    giveN.loadSettings(document.forms[0]);
    // }
});


/* Settings page load logic */
$(document).delegate("#settingsPage", "pageinit", function () {
    $('#bt_addCustom').on('click', function () {
        if ($('#fieldName').val() === '') alert('Please enter a custom field name');
        else {
            giveN.createCustomFieldRow($('#fieldName').val(), $('#fieldValue').val());
        }
    });



});


//$('.nontitratedRange').prop('disabled',this.checked).select('refresh');$('#startNumberRow').show();$('#highestNumberRow').show();$('#startNumber').val('');$('#highestNumber').val('');
//$('.nontitratedRange').prop('disabled',!this.checked).select('refresh');$('#startNumberRow').hide();$('#highestNumberRow').hide();$('#startNumber').val('-1');$('#highestNumber').val('-1');
$(document).delegate("#defaultPage", "pageinit", function () {
    $('#trialType-1').prop("checked", true).checkboxradio('refresh');
    $('#trialType-1').on('change', function () {
        //$('.nontitratedRange').prop('disabled', this.checked).select('refresh');
        
        $('#startNumberRow').show();
        $('#highestNumberRow').show();
        $('#startNumber').val('');
        $('#highestNumber').val('');
    });

    $('#trialType-2').on('change', function () {
        hideStartHighestRows();
    });


});


function hideStartHighestRows() {
    $('.nontitratedRange').prop('disabled', !this.checked).select('refresh');
    $('#startNumberRow').hide();
    $('#highestNumberRow').hide();
    $('#startNumber').val('-1');
    $('#highestNumber').val('-1');
}

/* Trials page load logic */
$(document).delegate("#doTestPage", "pageinit", function () {
    //Change the Enter key to go to next question, not finish
    $(window).keydown(function (event) {
        if (event.keyCode == 13) {
            event.preventDefault();
            next();
            return false;
        }
    });

    subjectRequestTemplate = document.getElementById('subjectRequest').innerHTML;

    Params.Trials = [];
    Params.CurrTrial = 1;
    Params.KL = 20;
    currentMockQuestion = 0;
    nextAsk = null;
    knowerLevelResult.KL = 20;//reset it, so that script doesnt think we've finished prematurely

    var trialData = JSON.parse(window.localStorage.getItem("giveN.trialData"));

    Params.trialType = trialData.trialType;
    if (Params.trialType == 'nontitrated') {
        nonTitratedSet = giveN.generateNontitratedTestSet(trialData.nontitratedRange);
        StartNumber = nonTitratedSet[0];
        HighestTestNumber = max(nonTitratedSet);
        MaxSet = parseInt(trialData.numberOfObjects, 10);
    } else {

        StartNumber = parseInt(trialData.startNumber, 10);
        HighestTestNumber = parseInt(trialData.highestNumber, 10);
        MaxSet = parseInt(trialData.numberOfObjects, 10);
    }
    next();
});

/* Highest Count page load logic */
$(document).delegate("#highestCountPage", "pageinit", function () {
    //Change the Enter key to finish
    $(window).keydown(function (event) {
        if (event.keyCode == 13) {
            event.preventDefault();
            giveN.saveHowHigh(); 
            $('#form1').submit();
            return false;
        }
    });

});


/* Verify page load logic */
$(document).delegate("#verifyPage", "pageinit", function () {
    var dOut = "";
    var d = giveN.getTrialData();
    for(p in d){
        dOut += "<b>"+p + "</b> = " + d[p] + "<br>";
    }

    dOut += "<table border='1'><tr><td>Requested</td><td>Initial Response</td><td>Final Response</td></tr>";
    for (var row = 0; row < d.trialRows.length; row++) {
        dOut += "<tr><td>" + d.trialRows[row][0] + "</td><td>" + d.trialRows[row][1] + "</td><td>" + d.trialRows[row][2] + "</td></tr>";
    }
    dOut += "</table>";

    $('#results').html("Sending this data:<br> " + dOut+"<br>");

});

/* Welcome */
$(document).delegate("#researcherWelcomePage", "pageinit", function () {
    function init() {
        // Clear forms here
        document.getElementById("researcherName").value = "";
        document.getElementById("researcherInstitution").value = "";
        document.getElementById("researcherEmail").value = "";
        document.getElementById("zip").value = "";
    }
    window.onload = init;
    
    var d = giveN.getResearcherInfo();
    if (d != null) {
        $('#researcherName').val(d[0]);
        $('#researcherInstitution').val(d[1]);
        $('#researcherEmail').val(d[2]);
        $('#zip').val(d[3]);
    }
    giveN.sendData(null, true);
});

/*parent page load logic*/
$(document).delegate("#parentWelcomePage", "pageinit", function () {
    function init() {
        // Clear forms here
        document.getElementById("parentName").value = "";
        document.getElementById("parentEmail").value = "";
        document.getElementById("zip").value = "";
    }
    
    window.onload = init;
    var d = giveN.getParentInfo();
    if (d != null) {
        $('#parentName').val(d[0]);
        $('#parentEmail').val(d[1]);
        $('#zip').val(d[2]);
    }
    giveN.sendData(null, true);
});

/*trial logic page load logic*/
$(document).delegate("#trialLogicPage", "pageinit", function () {

});

/*about page load logic*/
$(document).delegate("#aboutPage", "pageinit", function () {

});



function next() {
	

    if (nextAsk == null) nextAsk = StartNumber;
    ask = nextAsk;

    //var response = $("input[name=subjectResponseValue]").val();
    var responseFinal = document.getElementById('subjectResponseValue2').value;
    if (responseFinal == '') responseFinal = document.getElementById('subjectResponseValue1').value;
    var response = parseInt(responseFinal, 10);
    var responseInitial = parseInt(document.getElementById('subjectResponseValue1').value, 10);

    //validation - check if number given is valid:
	//must be less than maximum number
	//must be greater than 0;

    if(response < 1) {
    	alert("Please enter a valid number");
    	document.getElementById('subjectResponseValue1').value = '';
        document.getElementById('subjectResponseValue2').value = '';
        document.getElementById('subjectResponseValue1').focus();
        return;
    } else if (response > MaxSet) {
    	alert("Response exceeds maximum number of objects");
    	document.getElementById('subjectResponseValue1').value = '';
        document.getElementById('subjectResponseValue2').value = '';
        document.getElementById('subjectResponseValue1').focus();
        return;
    }

    //		document.getElementById('subjectRequest').innerHTML = subjectRequestTemplate.replace('{0}', mockData[currentMockQuestion]);

    if (currentMockQuestion > 0) {
        if (isNaN(response)) {
            alert("You didn't enter a number, please enter again.");
            document.getElementById('subjectResponseValue1').value = '';
            document.getElementById('subjectResponseValue2').value = '';
            document.getElementById('subjectResponseValue1').focus();
            
            
            return;
        }
      //  if (Params.trialType == 'titrated') {

        nextAsk = GiveN(0, 20, response, ask, Params, knowerLevelResult, Params.trialType, nonTitratedSet);
//        } else {
//            Params.Trials[Params.CurrTrial - 1] = [];
//            Params.Trials[Params.CurrTrial - 1][1 - 1] = AskNumber;
//            Params.Trials[Params.CurrTrial - 1][2 - 1] = Ans;
//            if (currentMockQuestion < nonTitratedSet.length) {
//                nextAsk = nonTitratedSet[currentMockQuestion];
//            } else {


//                /**Works with these global vars
//HighestTestNumber
//NCorrect
//NInc
//NFalse
//NTrials
//Params.Trials
//KLMatrix
//KL
//Params.KL
//*/

//                DetermineKL();

//                nextAsk = -1;
//                //knowerLevelResult.KL = -1;
//            }
            
        //}
        addRow('dataTable', ask, responseInitial, response);
        if (knowerLevelResult.KL < 20) {
            //finished
        //    document.getElementsByName("KL")[0].value = knowerLevelResult.KL;
            //    document.getElementsByName("ie_KL")[0].value = knowerLevelResult.ie_KL;
            giveN.storeTrialResultData(knowerLevelResult.KL, knowerLevelResult.ie_KL);
            //  document.form1.submit();
            $('#form1').submit();
        }
    }

    var nums = document.getElementsByClassName('num');
    for (var i = 0; i < nums.length; i++) {
        nums[i].innerHTML = nextAsk; //mockData[currentMockQuestion];
    }



    document.getElementById('subjectResponseValue1').value = "";
    document.getElementById('subjectResponseValue2').value = '';
    document.getElementById('subjectResponseValue1').focus();

    //document.getElementById('trialNum').innerHTML = currentMockQuestion + 1;
    $('#trialNum').html(currentMockQuestion + 1);

    currentMockQuestion++;
}

function addRow(tableID, requested, givenInitially, givenFinally) {
    var tableRef = document.getElementById(tableID);

    var newRow = tableRef.insertRow(-1);

    // Insert a cell in the row at index 0
    var newCell = newRow.insertCell(0);

    var newText = document.createTextNode(currentMockQuestion);
    newCell.appendChild(newText);


    var newCell = newRow.insertCell(1);

    var newText = document.createTextNode(requested);
    newCell.appendChild(newText);


    var newCell = newRow.insertCell(2);

    // Append a text node to the cell
    var newText = document.createTextNode(givenInitially);
    newCell.appendChild(newText);

    var newCell = newRow.insertCell(3);

    // Append a text node to the cell
    var newText = document.createTextNode(givenFinally);
    newCell.appendChild(newText);

    giveN.addTrialRow(requested, givenInitially, givenFinally);

    

}

//Mostly settings functions

var giveN = {

	settings : ['trialType', 'languagesSpoken', 'otherLanguageSpoken', 'languageOfSession', 'otherLanguageOfSession', 
						'numberOfObjects', 'startNumber', 'highestNumber', 'nontitratedRange'],
	radioSettings: ['trialType'],
	selectMenuSettings: ['languagesSpoken', 'languageOfSession'],

	customFields: [],

	saveHowHigh: function(){
	    var data = this.getTrialData();
	    data.howHigh = $('#howHigh').val();

	    window.localStorage.setItem("giveN.trialData", JSON.stringify(data));
	},

	abortTest: function () {
	    var data = this.getTrialData();
	    
	    if (data.trialRows !=null && data.trialRows.length > 0 && confirm('Send partial data?')) {
	        // giveN.storeTrialResultData(knowerLevelResult.KL, "PD"); //I think this is failing because KL can't be assigned yet
	        $('#form1').submit();
	    } else {
	        giveN.clearTrialDataResponses();
	        $.mobile.navigate('default.html');
	    }
	},  

	clearTrialDataResponses: function(){
	    var data = this.getTrialData();
	    window.localStorage.setItem("giveN.trialData", JSON.stringify(data));
	},

    clearAllData: function(){
        window.localStorage.clear();
        var data = this.getTrialData();
        alert("Data cleared");
    },

    clearDataEnd: function(){
        window.localStorage.clear();
        var data = this.getTrialData();
        $.mobile.navigate('index.html');
    },

    clearTrialRows: function(){
        //clear all non meta-data fields in data
        var data = this.getTrialData();

        data.dob = null;
        data.gender = null;
        data.highestNumber = null;
        data.numberOfObjects = null;
        data.startNumber = null;
        data.subjectId = null;
        data.trialDateTime = null;
        data.trialType = null;
        data.trialRows = null;

        //set these items to null in local storage
        window.localStorage.setItem('giveN.trialData', JSON.stringify(data));

        //then go back to dotest page
        $.mobile.navigate('partials/default.html');
    },

	updateQueueStatus: function () {
        
	    $('#footer').html( giveN.getNumberOfQueuedTrials() + " trials queued to send to the server.");
	},

	getNumberOfQueuedTrials: function(){
	    var d = giveN.getDataToSend();
	    if (d == null) return 0;
	    else return d.length;

	},

	sendData: function (newData, background) {
        if(newData!=null)
            giveN.addDataToSend(newData);
        
    	    $.ajax({
    	        crossDomain: true,
    	        timeout: 10000,
    	        type: 'POST', // it's easier to read GET request parameters
    	        url: backendServletURL,
    	        // dataType: 'JSON',
    	        data: {
    	            trialData: JSON.stringify(giveN.getDataToSend())
    	        }
    	    }).done(function(data) {
                    giveN.setDataToSend([]);
                    if (!background) alert("Data sent successfully.");
                    window.location.href ="../confirmation.html";

                    //clear local storage
                    // window.localStorage.clear();

                    //clear data
                    // var data = this.getTrialData();
                    // alert("Data sent successfully");
            }).fail(function (data, textStatus, message) {

                    if (textStatus === 'timeout') {
                        if (!background) alert("Could not connect to the server, will try sending next time your run this app.");

                    } else {
                        if(message.length>0)
                            alert("Sorry could not send data:" + message + " - will try again next time the app is run.");
                        else if (data.responseText.length > 0)
                            alert("Sorry could not send data:" + data.responseText + " - will try again next time the app is run.");
                            
                    }
                }
            );
	},

	generateNontitratedTestSet:function(testNumbers){

	    //convert testNumbers to ints
	    for(var i=0; i<testNumbers.length;i++)
	        testNumbers[i] = parseInt(testNumbers[i], 10);
	    
	    var originalTestNumbers = testNumbers.slice(0);

	    var set = [];
	    //if testNumbers = ['3', '2', '4'], then randomize like
	    //set = [3,2,4,    4,3,2,    2,3,4]


	    function getRandom(hi){
	        return Math.floor(Math.random()*hi);
	    }

	    for (var i = 0; i < 3; i++) {
	        testNumbers = originalTestNumbers.slice(0);
	        for (var j = 0; j < originalTestNumbers.length; j++) {
	            var indx = getRandom(testNumbers.length);
	            set[set.length] = testNumbers[indx];
	            testNumbers.splice(indx, 1);
	        }


            
	    }
	    return set;
	},
	

	getDataToSend: function () {
	    
	    return JSON.parse(window.localStorage.getItem("giveN.trialDataToSend"));
	},
	setDataToSend: function (data) {
	    window.localStorage.setItem("giveN.trialDataToSend", JSON.stringify(data));
	},
	addDataToSend: function (newData) {
	    var existingUnsent = this.getDataToSend();
	    if (existingUnsent == null) existingUnsent = [];

	    existingUnsent[existingUnsent.length] = newData;//.slice(0);//giveN.getTrialData();
	    existingUnsent[existingUnsent.length - 1].trialRows = existingUnsent[existingUnsent.length - 1].trialRows.slice(0);
	    giveN.clearTrialDataResponses();
	    
	    giveN.setDataToSend(existingUnsent);
	},


	saveSettings : function(form){
		
		for(var i=0; i<this.settings.length; i++){
			var el = $(form[this.settings[i]]);
			var val = el.val();
			if (jQuery.inArray(this.settings[i], this.radioSettings) !== -1) {//see if this setting is a radio setting
			    $('input[name=' + this.settings[i] + ']').checkboxradio('refresh');

			    $.each($('input[name = ' + this.settings[i] + ']'), function () {$(this).checkboxradio("refresh");});//attr("checked", CheckValue)

			    //val = $('input[name='+this.settings[i]+']:checked').val();
			    //val = $('input[name=' + this.settings[i] + ']').checkboxradio('refresh').val()

			    val = this.getCheckedCheckbox(form.name, this.settings[i]);
			}
			
		
			window.localStorage.setItem("giveN."+this.settings[i], JSON.stringify(val));		
		}

		for (var i = 0; i < this.customFields.length; i++) {
		    window.localStorage.setItem("giveN." + this.customFields[i], JSON.stringify($(form[this._getSafeFieldName(this.customFields[i])]).val()));
		}

		window.localStorage.setItem("giveN.customFields", JSON.stringify(this.customFields));

	},

	getCheckedCheckbox: function(formName, name){

	    var status = $('form[name="'+formName+'"] input[name=' + name + ']').map(function () {
	        
	        return {'val':$(this).val(), 'checked': $(this).is(':checked')};
	            /*return { 'name': name, 'status': 'Checked' };
	        else
	            return { 'name': name, 'status': 'UnChecked' };
                */
	    });
	    for (var i = 0; i < status.length; i++) {
	        if (status[i].checked) return status[i].val;
	    }
	    return null;
	},
	
	loadSettings: function (form) {
	    this.customFields = [];
		for(var i=0; i<this.settings.length; i++){
			var v = window.localStorage.getItem("giveN."+this.settings[i]);
			if(v!='undefined'){
			    if (jQuery.inArray(this.settings[i], this.radioSettings) !== -1) {//see if this setting is a radio setting
			        if (v != null) {
			            $("input[name=" + this.settings[i] + "]").prop("checked", false).checkboxradio().checkboxradio('refresh');
			            $("input[name=" + this.settings[i] + "][value='" + JSON.parse(v) + "']").prop("checked", true).checkboxradio().checkboxradio('refresh');
			        }
			    } else if (jQuery.inArray(this.settings[i], this.selectMenuSettings) !== -1) {//see if this setting is a selectmenu setting
			        $("select[name=" + this.settings[i] + "]").val(JSON.parse(v)).selectmenu('refresh');

			    } else {
			        $("input[name=" + this.settings[i] + "]").val(JSON.parse(v)).textinput().textinput('refresh');
			    }
			}
		}

	    //document.getElementById('nontitratedRange').style.visibility = JSON.parse(window.localStorage.getItem("giveN." + 'trialType'))=='nontitrated' ? 'visible' : 'hidden';
		$(".nontitratedRange").prop("disabled", JSON.parse(window.localStorage.getItem("giveN." + 'trialType')) != 'nontitrated');

		if (JSON.parse(window.localStorage.getItem("giveN." + 'trialType')) == 'nontitrated') {
		    hideStartHighestRows();
		}

		var readCustomFields = JSON.parse( window.localStorage.getItem("giveN.customFields"));
		if (readCustomFields != null) {

		    for (var i = 0; i < readCustomFields.length; i++) {
		        this.createCustomFieldRow(readCustomFields[i], JSON.parse( window.localStorage.getItem("giveN." + readCustomFields[i]) ));
		    }
		}

	},

	addTrialRow: function (requested, givenInitially, givenFinally) {
	    var existingTrialData = JSON.parse( window.localStorage.getItem("giveN.trialData"));
	    if(existingTrialData==null)
	        alert("Sorry, please start again, somehow you are adding trial data before the subject's data has been added.");
	    if(existingTrialData.trialRows == null)
	        existingTrialData.trialRows = [];
	    if (isNaN(requested))
	        requested = '0';
	    if (isNaN(givenInitially))
	        givenInitially = '0';
	    if (isNaN(givenFinally))
	        givenFinally = '0';
	    existingTrialData.trialRows[existingTrialData.trialRows.length] = [parseInt(requested,10), parseInt(givenInitially,10), parseInt(givenFinally,10)];

	    window.localStorage.setItem("giveN.trialData", JSON.stringify(existingTrialData));
	},

	getTrialData: function(){
	    return JSON.parse( window.localStorage.getItem("giveN.trialData") );
	},


	onSetupSubmit: function (form) {
	    var requiredNames = ['subjectId', 'dob', 'numberOfObjects', 'startNumber', 'highestNumber'];
	    for (var i = 0; i < requiredNames.length; i++) {
	        if ($(form[requiredNames[i]]).val() == null || $(form[requiredNames[i]]).val().length == 0) {
	            alert("Please ensure all fields are filled in.");
	            return false;
	        }

	    }


	    this.storeTrialMetaData(form);
	    return true;
	},

	readMultiCheckBoxes: function(form, name){
	    var ntrs = [];
	    for (var i = 1; i <= 10; i++) {
	        if ($(form[name + i]).is(':checked')) {
	            //ntrs[ntrs.length] = $(form[name + i]).val();//'' + i;
	            ntrs[ntrs.length] = $(form[name + i]).jqmData('val');
	        }
	    }
	    
	    return ntrs;
	},

	storeTrialMetaData: function(form){
	    var data = this.getTrialData();
	    var names = ['subjectId', 'gender', 'dob',  'otherLanguageSpoken',  'otherLanguageOfSession', 'numberOfObjects', 'startNumber', 'highestNumber'];
	    //names = names.concat(this.customFields);
	    for (var i = 0; i < names.length; i++) {
	        data[names[i]] = $(form[names[i]]).val();

	    }

	    //nontitratedrange is a special pain, because we couldn't use multiple select with iOS7 bugs
	  /*  var ntrs = [];
	    for (var i = 1; i <= 10; i++) {
	        if ($(form['nontitratedRange' + i]).is(':checked')) {
	            ntrs[ntrs.length] = '' + i;
	        }
	    }
	    data['nontitratedRange'] = ntrs;
        */

	    data['nontitratedRange'] = this.readMultiCheckBoxes(form, 'nontitratedRange');
	    data['languagesSpoken'] = this.readMultiCheckBoxes(form, 'languagesSpoken');
	    data['languageOfSession'] = $('input[name=languageOfSession]:checked', form).jqmData('val');


	    //create a custom fields object, and store it as a stringified string in the 'customFields' property of 'data'
	    //that means it will be stringified again when stringify JSON.stringify(data), but thats what we want.
        //we need customfields to be stringified because we can't dynamically map custom properties to a class in Java
	    var cF = {};

	    for (var i = 0; i < this.customFields.length; i++) {
	        cF[this.customFields[i]] = $(form[this._getSafeFieldName(this.customFields[i])]).textinput().val();
	    }

	    data.customFields = JSON.stringify(cF);

	    var today = new Date();
	    var dd = today.getDate();
	    var mm = today.getMonth() + 1; //January is 0!
	    var yyyy = today.getFullYear();
	    data.trialDateTime = yyyy + "-" + mm + "-" + dd + " " + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

	    data.trialType = this.getCheckedCheckbox(form.name, 'trialType');

	    data.clientSerial = Math.round((Math.random() * 1000000000));

	    window.localStorage.setItem("giveN.trialData", JSON.stringify(data));
	},



	storeTrialResultData: function (KL, ie_KL) {
	    var data = this.getTrialData();
	    data.KL = KL;
	    data.ie_KL = ie_KL;
	    window.localStorage.setItem("giveN.trialData", JSON.stringify(data));
	},


	storeResearcherInfo: function(researcherName, researcherInstitution, researcherEmail, zip){
	    if (researcherName.length == 0 || 
            researcherInstitution.length == 0 ||
            researcherEmail.length == 0) {
	        alert("Please enter researcher's name, institution, and email.");
	        return false;
	    } else if (zip.length == 0) {
	        alert("Please enter at least an approximate ZIP/Postal code for the location.");
	        return false;
	    } else if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(researcherEmail) !== true) {
	    	alert("Invalid email address");
	    	return false;
	    }

	    var data = {};
	    data.trialRows = null;
	   	data.userDesignation = "Researcher";
	    data.userName = researcherName;
        data.userInstitution = researcherInstitution;
	    data.userEmail = researcherEmail;
	    data.zip = zip;
	    window.localStorage.setItem("giveN.trialData", JSON.stringify(data));
	},

    storeParentInfo: function(parentName, parentEmail, zip){
        if (parentName.length == 0 || 
            parentEmail.length == 0) {
            alert("Please enter your name and email.");
            return false;
        } else if (zip.length == 0) {
            alert("Please enter at least an approximate ZIP/Postal code for the location.");
            return false;
        } else if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(parentEmail) !== true) {
	    	alert("Invalid email address");
	    	return false;
	    }
        var data = {};
        data.trialRows = null;
        data.userDesignation = "Parent";
        data.userName = parentName;
        data.userInstitution = "NA (parent)";
        data.userEmail = parentEmail;
        data.zip = zip;
        window.localStorage.setItem("giveN.trialData", JSON.stringify(data));
    },

	getResearcherInfo: function(){
	    var data = this.getTrialData();
	    if (data != null) {
	        return [data.researcherName, data.researcherInstitution, data.researcherEmail, data.zip];
	    } else return null;
	},

    getParentInfo: function(){
        var data = this.getTrialData();
        if (data != null) {
            return [data.parentName, data.parentEmail, data.zip];
        } else return null;
    },

	_getSafeFieldName: function (fieldName){
	    var fName = fieldName.replace(/[\'|\"]/, '');
	    fName = fName.replace(/\W/, '_');
	    return fName;
	},
	
	createCustomFieldRow: function (name, value) {
	    var isSettingsPage = $('#settingsPage').length > 0;
	    var fName = this._getSafeFieldName(name);

	    if (jQuery.inArray(name, this.customFields) !== -1) {
	        alert('Cannot add that field as a similar name is already in use, please use a different field name');
	    } else {



	        var rowDiv = $('#customFields');

	        var actionLinks = "";
	        if (isSettingsPage) {
	            actionLinks = '<a href=\'javascript: giveN.editCustomField("'+ fName + '")\'>Edit</a>\
			            <a href=\'javascript: if(confirm("Are you sure, delete '+ name + '?")){giveN.deleteCustomFieldRow("' + fName + '")}\'>X</a>';
	        }

	        
	        rowDiv.append('<div id="' + fName + '_DIV"><div  class="col-md-3">\<label for="' + fName + '" id="' + fName + '_LB">' + name + '</label></div>\
		            <div class="col-md-9">\
			            <input type="text"  name="'+ fName + '" id="' + fName + '" value="' + value + '" />\
			            '+actionLinks+'</div></div>');

	        this.customFields[this.customFields.length] = name;
	    }
	
	},
	
	deleteCustomFieldRow: function (fName){
		var rowDiv = $('#'+fName+'_DIV');
		rowDiv.remove();
		giveN.customFields.splice($.inArray(fName, giveN.customFields), 1);
	},
	
	editCustomField: function (fName) {
	    $('#bt_customFieldChange').off('click');
	    $('#bt_customFieldChange').on('click', function () {
	        giveN.doEditCustomField(fName);
	    });
	    $('#editFieldName').val($('#' + fName + '_LB').text());
	    $("#popupEditCustomField").popup("open");
	},

	doEditCustomField: function (fName) {
	    var currentDefaultVal = $('#' + fName).val();
	    giveN.deleteCustomFieldRow(fName);
	    giveN.createCustomFieldRow($('#editFieldName').val(), currentDefaultVal);
	    
	    
	    
        
	    $("#popupEditCustomField").popup("close");
	},





};