
var currentMockQuestion = 0;
var firstAsk = null, ask, nextAsk = firstAsk;
var subjectRequestTemplate;
var knowerLevelResult = {};//we'll get back the result of the test for each iteration here.
var Params = {}; 


var KL = 20;

var trackerInit = 0;

//NB: the -1s all over the place come from differences between MATLAB and JS indexing

//This number can be changed if the experimenter wants to start at a number
//other then 3. In the app, we would like the experimenter to have a choice
//to either set it themselves or have the app calculate a recommendation based on the
//child's age (calculated from date of birth and current date).
StartNumber = 3;
//Highest Test Number is the highest number the experimenter wants to query.
//This should be able to be changed under a settings menu.
HighestTestNumber = 8;

function zeros(dimension1, dimension2) {
    var a = [];
    for (var i = 0; i < dimension1; i++) {
        for (var j = 0; j < dimension2; j++) {
            if (j == 0) a[i] = [];
            a[i][j] = 0;
        }
        if (dimension2 == 0) a[i] = 0;
    }
    return a;
}

function size(matrix) {
    return matrix.length;
}

function get(matrix, dimension1, dimension2) { //this is a function converted from matlab
    if (dimension1 == ':') {//in matlab, : means get entire column
        var vector = [];
        for (var i = 0; i < matrix.length; i++) {
            vector[i] = matrix[i][dimension2 - 1];
        }
        return vector;
    } else {
        return matrix[dimension1 - 1][dimension2 - 1];
    }
}

function max(vector) {
    var biggest = -1;
    for (var i = 0; i < vector.length; i++) {
        if (vector[i] > biggest) biggest = vector[i];
    }
    return biggest;
}

function GiveN(SubjID, KL, Ans, AskNumber, Params, KnowerLevelResult, type, nonTitratedSet) {
    //Asks for Subject ID and creates a file to save child's data.

    //Current Trial #. Starts at 1
    //Params.CurrTrial = 1;
    //dummy variable to verify that a new subject code has been entered and we
    //aren't over writing previous data.
    ValidName = 0;
    //Assigns dummy values to 3 variables used in the logic in the main part of
    //the program.
    HoldAskNumber= 100;
    skipflag = 0;

    // KL matrix is vector the length of highest test number. Each cell is set
    // to 0 by default. If we receive sufficient evidence that a child knows a
    // number, say 2, the 0 in the 2nd position of the vector will change to +1.
    // If we receive sufficient evidence that a child does not know 2, this 0
    // will change to a -1. If there is a +1 in the Nth position and a -1 in the
    // N+1th position, the program ends and the child is declared an N-knower (
    // because s/he knows N but does not know N+1.)

    KLMatrix = zeros(HighestTestNumber, 0);


    //**    while (KL==20){ //KL is set to 20 at the beginning of the program. So basically this is saying, while we have not determined KL, keep going...
    if (skipflag == 1) { //occasionally, we do not follow the standard order of up one number for correct, down one number for incorrect. In these cases skipflag is changed to 1.
        AskNumber = HoldAskNumber;//forces ask number to HoldAskNumber
        HoldAskNumber = 100;// resets our variable HoldAskNumber to dummy value 100.
        skipflag = 0; //this sets skipflag back to 0; continues with 1 up 1 down
    }
    if (HoldAskNumber < 100) { 
        skipflag = 1;
    }
 
    // save number asked and number responded to Params.Trials
    Params.Trials[Params.CurrTrial-1] = [];
    Params.Trials[Params.CurrTrial-1][0] = AskNumber;
    Params.Trials[Params.CurrTrial-1][1] = Ans;

    //save Params.Trials to a variable of a different name without sub variables because this
    //helps it save to ascii...
    datatobesaved = Params.Trials;

    //Progresses trials numbers
    Params.CurrTrial = Params.CurrTrial + 1;

    //initialize tracker array;
    if (trackerInit == 0) {
	    //Make an array for tracking NCorrect, etc. 
		Params.Tracker = [];

		for (var i = 1; i <= HighestTestNumber; i++) {
			Params.Tracker[i-1] = [i, 0, 0, 0, 0]; //[N, NTrials, NCorrect, NInc, NFalse];
		}
		trackerInit = 1;
	}

	//update tracker
	if (Params.Trials[Params.CurrTrial-1][0] == AskNumber) {
		Params.Tracker[AskNumber-1][1]++; //update NTrials for every trial
		if (Params.Trials[Params.CurrTrial-1][1] == AskNumber) { //if correct
			Params.Tracker[AskNumber-1][2]++; //increment NCorrect by 1
		} else {
			if (Params.Trials[Params.CurrTrial-1][1] >= HighestTestNumber) { //if the number given is within test range
				Params.Tracker[Ans-1][1]++; //update NFalse
			}
			Params.Tracker[AskNumber-1][3]++; //increment NInc by 1
		}
	}

    //This loops goes through each number from 1 to the highest number
    //tested to determine whether there is sufficient evidence that the
    //child knows or does not know N. If child knows N and does not know
    //N-1, Knower Level is determined.
    for (var n = 1; n <= HighestTestNumber; n++) {
        NCorrect = 0;   //NCorrect counts how many inquiries child as gotten correct when asked for N thus far.
        NInc = 0;       //NInc counts how many inquires for N a child has gotten incorrect
        NFalse = 0;     // NFalse counts how many times child has responded N to trials that are not asking for N. E.g. if N=3, how many times a child gave 3 when asked for 1, 2, 4, 5, etc.
        NTrials = 0;    // Total number of trials child has been asked for N. Is redundant because Ntrials=Ncorrect+Ninc. But helps for understanding purposes.

        // Params.Trials is a 2 column matrix that creates a new row for
        // each trial.Column 1 is set to Ask Number (see above) and column 2
        // is set to the child's response (also see above)
        // The following section of the code goes through each row of
        // Params.Trials searching for trials where N is requested and
        // tallying up NCorrect, NInc, NFalse and NTrials.
        //for t=1:size(Params.Trials,1);
        for (var t = 0; t < size(Params.Trials) ; t++) {

            //RMS: the following is going through the array of params.trials, which is (asked, answered)
            //RMS: this is looped through for every trial
            //RMS: if the first item (asked) is equal to the current n (incremented by outer for loop), number of trials on which kid asked for N increases by 1
            //RMS: if the second item is also N, NCorrect = +1
            //RMS: if not, the kid didn't give N, so NInc = +1
            //RMS: Then, if the first item in the array is NOT current n (defined by outer loop), but the second item (answer) is, NFalse (num trials on which child incorrectly gave n for another number) +1
            if (Params.Trials[t][0] == n) {
            	// Params.Tracker[AskNumber-1][1]++; // update NTrials
                NTrials = NTrials + 1;
                if (Params.Trials[t][1] == n) {
                // Params.Tracker[AskNumber-1][2] = Params.Tracker[AskNumber-1][2]+1; //update correct	
                    NCorrect = NCorrect + 1;
                } else {
                	// Params.Tracker[AskNumber-1][3] = Params.Tracker[AskNumber-1][3]+1; //update incorrect
                    NInc = NInc + 1;
                }
            } else if (Params.Trials[t][0] != n) {
                if (Params.Trials[t][1] == n) {
                    NFalse = NFalse + 1;
                    // if(Params.Trials[t][1] <= HighestTestNumber) {
                    // 	Params.Tracker[Ans-1][4] = Params.Tracker[Ans-1][4]+1; //update False if within testing range
                    // }
                }
            }
        }

        //This section of the code determines whether or not there is
        //sufficient evidence that a child knows or does not know N.

        // If child has at least two trials @ N and the number correct is
        // greater then or equal to 2/3rds, the child may know N.

        if (NTrials > 1 && NCorrect / NTrials >= (2 / 3)) {
            //if more then 1/3 times the child provides N, it is on a trial
            //that is not requesting N, the child does NOT know N. So, the
            //Nth element of KLMatrix is set to -1.

            if (NCorrect / (NFalse + NCorrect) < (2 / 3)) {
                KLMatrix[n-1] = -1;
                //OTherwise, child does know N and the Nth Element of KL matrix
                //is set to 1.
            } else {
                KLMatrix[n-1] = 1;
            }
            //RMS: if num. trials on which child is asked for N >2, and if child gave N correctly less than 2/3 of times they were asked, they don't know N (set to -1)
        } else if (NTrials > 2 && NCorrect / NTrials <= 2 / 3) {
            KLMatrix[n-1] = -1;
            //RMS: if num. trials on which child is asked for N == 2, but they haven't gotten either correct, they don't know N (set to -1)
        } else if (NTrials == 2 && NCorrect == 0) {
            KLMatrix[n-1] = -1;
            //RMS: If the num. trials on which child FALSELY gave N for another number is >1, and if the num. of times they gave it correctly (divided by both correct and false gives) is less than 2/3, they don't know N
        } else if (NFalse > 1 && NCorrect / (NFalse + NCorrect) <= (2 / 3)) {
            KLMatrix[n-1] = -1;
        }

        //if child passes criteria for Highest Test Number, sets KL to this.
        if (KLMatrix[n-1] == 1 && n == HighestTestNumber) {
            KL = HighestTestNumber;
            Params.KL = HighestTestNumber;
            break
            //if child passes criteria for N and fails criteria for N+1, then
            //sets KL to n.

        } else if (KLMatrix[n-1] == -1) { //if child is failing criteria n
            // if child is failing criteria for n (above) and n= 1, sets KL to 0 (since child is failing at 1)
            if (n == 1) {
                KL = 0;
                Params.KL = 0;
                break
                //if child is failing at n and succeeding at n-1, sets KL to
                //n-1 . 
            } else if (KLMatrix[n - 2] == 1) { //if the child is failing criteria for n
            	//knower level is N-1
                KL = n - 1;
                Params.KL = n - 1;
                break
            } else { 
            	KL = 20; 
            	break
            }
        }
    }
    
    //If knower level was not determined during the above loop, continue...
    if (KL == 20  || type==='nontitrated') {
        //sets  hold on the ask number from the previous trial.
        PreviousAskNumber = AskNumber;
        //if child gave correct answer on last trial...
        if (Ans == AskNumber) {
            //And if the asknumber on previous trial is not equal to the Highest
            //test number, increase by 1.
            if (AskNumber != HighestTestNumber) {
                AskNumber = AskNumber + 1;
            }
            //also make sure this loop does not go below 1
            // otherwise, if child is wrong, decrease ask number by 1, so long as
            // ask number on previous trial was not already set to 1....
            // it
        } else if (AskNumber != 1) {
            AskNumber = AskNumber - 1;
        } else if (AskNumber == 1) { //make sure this loop doesn't go below 1
        	AskNumber = AskNumber;
        }
        //Creates dummy variable.
        nextflag = 0;
        //while dummy variable nextflag still equals 0,
        while (nextflag == 0) {
            //in the event that we have already determined that child does not
            //know Ask Number (As determined by above loop, decrease ask number by
            //1) This sometimes happens in child gives N for not N requests but
            //also for requests for N.For example, if a child always gives 2 for 2
            //and 3, in order for us to find out if he is a one knower, we have to
            //also ask for 1 but the above logic will never get us there without
            //this bit.
            if (KLMatrix[AskNumber-1] == -1) {
                AskNumber = AskNumber - 1;
            } else {
                nextflag = 1;
            }
        }
        //Problem is, sometimes the above bit will lead to testing the same
        //number twice. or in the case of non-knowers 1 will be tested twice.
        //This tries to avoid that. After testing this number, program returns
        //to the duplicated number
        if (PreviousAskNumber == AskNumber) {
            HoldAskNumber = AskNumber;
            //If you are already at Highest Test number ask, one number lower
            if (AskNumber == HighestTestNumber) {
                AskNumber = HighestTestNumber - 1;
            } else if (AskNumber == 1) { //or if the AskNumber is one, test go up one number
            	AskNumber = AskNumber + 1;
            } else {
                // Otherwise, ask for one higher than the max tested so far.

                AskNumberVector = get(Params.Trials, ':', 1);

                if (max(AskNumberVector) == HighestTestNumber) {

                    AskNumber = 1;
                } else {
                    AskNumber = max(AskNumberVector) + 1;
                }
            }
        }



    }

    if (type === 'nontitrated') {
        if((Params.CurrTrial-1)<nonTitratedSet.length){ 
            AskNumber = nonTitratedSet[Params.CurrTrial-1];
            //KL will have been set above
        }
    }



    if ((type ==='nontitrated' && (Params.CurrTrial-1)==nonTitratedSet.length) || type ==='titrated'){

        // if KL is higher then 4, we typically categorize the child as a
        // "CP-knowers" because if the child knows 1-5, they are highly likely to be
        // a CP knowers and errors are more likely to result from simple
        // carelessness. This prints out "CP" in addition to numerical KL for KLs>4.
        var ie_KL = null;
        if (KL > 4 && KL < 20) {
            ie_KL = 'CP';
        } else
            ie_KL = KL;

        KnowerLevelResult.KL = KL;
        KnowerLevelResult.ie_KL = ie_KL;


    }

    return AskNumber;
}

