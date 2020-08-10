
var currentMockQuestion = 0;
var firstAsk = null, ask, nextAsk = firstAsk;
var subjectRequestTemplate;
var knowerLevelResult = {};//we'll get back the result of the test for each iteration here.
var Params = {}; 


var KL = 1000;

var trackerInit = 0;
var updateTrackerInit = 0;
var maxNumberInit = 0;

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
    

    // KL matrix is vector the length of highest test number. Each cell is set
    // to 0 by default. If we receive sufficient evidence that a child knows a
    // number, say 2, the 0 in the 2nd position of the vector will change to +1.
    // If we receive sufficient evidence that a child does not know 2, this 0
    // will change to a -1. If there is a +1 in the Nth position and a -1 in the
    // N+1th position, the program ends and the child is declared an N-knower (
    // because s/he knows N but does not know N+1.)
 
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
    //initialize KLMatrix
    if (trackerInit == 0) {
	    //Make an array for tracking NCorrect, etc. 
		Params.Tracker = [];
		Params.KL = 1000;

		for (var i = 1; i <= HighestTestNumber; i++) {
			Params.Tracker[i-1] = [i, 0, 0, 0, 0]; //[N, NTrials, NCorrect, NInc, NFalse];
		}

		//Initialized KLMatrix so that zeros are not reset every time
		KLMatrix = zeros(HighestTestNumber, 0);
    	KLMatrixTest = zeros(HighestTestNumber, 0);

    	//set tracker init to 1 so that it doesn't run again
		trackerInit = 1;
	}

	//update tracker
	if (AskNumber == AskNumber) {//run this every time
		Params.Tracker[AskNumber-1][1]++; //update NTrials for every trial
		if (Ans == AskNumber) { //if correct
			Params.Tracker[AskNumber-1][2]++; //increment NCorrect by 1
		} else { //if answer is not correct
			Params.Tracker[AskNumber-1][3]++; //regardless, increment NInc by 1
			if (Ans <= HighestTestNumber) { //if the number given is within test range
				Params.Tracker[Ans-1][4]++; //also update false
			}
		}
	}

	//rename these so the logic is a little easier to read
	//Trials, successes, failures, and false for the Asknumber
	NumTrials = Params.Tracker[AskNumber-1][1]; //number of trials asked about N
	NumSuccesses = Params.Tracker[AskNumber-1][2]; //number of successes for N
	NumFailures = Params.Tracker[AskNumber-1][3]; //number of failures for N
	NumFalseAskNumber = Params.Tracker[AskNumber-1][4]; //number of times N (current ask number) given falsely for another number
	
	//we also need to keep track of these for the answer, IF the answer is within the potential set of nums
	if (Ans <= HighestTestNumber) {
		NumTrialsAnswer = Params.Tracker[Ans-1][1]; //number of trials asked about N (current ANSWER)
		NumSuccessesAnswer = Params.Tracker[Ans-1][2]; //number of successes for N (current ANSWER)
		NumFailuresAnswer = Params.Tracker[Ans-1][3]; //number of failures for N (current ANSWER)
		NumFalseAnswer = Params.Tracker[Ans-1][4]; //number of times N (current ANSWER) has been given falsely for another number
	} else {
		NumTrialsAnswer = null;
		NumSuccessesAnswer = null;
		NumFailuresAnswer = null;
		NumFalseAnswer = null; 
	}
	

	//Logic for updating KL Matrix
	//This will be run when we have at least 3 trials
	//For a given N (Current Ask Number), we will check whether this is enough evidence to update the KL Matrix
	//TO-do; break this out into a separate function

	
	if (Params.CurrTrial >= 2) { //if we have at least two trials worth of data
		if (Ans <= HighestTestNumber) {//if we need to update the tracker based on the answer
			if (NumFalseAnswer >= 2 ) {
				KLMatrix[Ans-1] = -1;
			}
			if (NumFalseAnswer > 1 && NumSuccessesAnswer / (NumSuccessesAnswer + NumFailuresAnswer) < 2/3) {
				//If they have falsely given N for another number at least twice
				//they do not know N
				KLMatrix[Ans-1] = -1;
			}
			if (NumFalseAnswer + NumFailuresAnswer >= 3 && NumSuccessesAnswer/(NumSuccessesAnswer + NumFailuresAnswer) < 2/3) { 
				//this is to catch kids who are bombing a response
				KLMatrix[Ans-1] = -1;
			}
			if (NumTrialsAnswer > 1 && NumSuccessesAnswer/(NumSuccessesAnswer + NumTrialsAnswer) >= 2/3) {
				//if the child has been asked about that answer in the past 
				//and if of those times they have correctly given N at least 2/3 of the time 
				//they might know N
					if (NumTrialsAnswer >= 2 && NumSuccessesAnswer/(NumSuccessesAnswer + NumFailuresAnswer) < 2/3) {
						//if they have 2 trials worth of data
						//but if they have failed to correctly give N more than 2/3 of the time
						//they do not know N
						KLMatrix[Ans-1] = -1;
					} else if (NumTrialsAnswer >= 2 && NumSuccessesAnswer/(NumSuccessesAnswer + NumFailuresAnswer) >= 2/3) {
						//if they have at least 2 trials of data
						//and if they have given N correctly at least 2/3 of the time
						//they might know N
						//but we need to check and make sure they are not falsely giving N for other numbers
						if (NumFalseAnswer/(Params.CurrTrial - NumTrialsAnswer) >= 2/3) {
							//if they have incorrectly given N more than 2/3 of the time
							//in response to other Ns
							//they do not know N
							KLMatrix[Ans-1] = -1;
						} 
						//otherwise, they know N
						KLMatrix[Ans-1] = 1;
					}
			}
		}
		if (NumTrials >= 2 && NumSuccesses == 0) {
			//if the child has been asked about this particular number at least 2x
			//and has failed 2x, it's likely they don't know N
			KLMatrix[AskNumber-1] = -1;
		}
		if (NumFalseAskNumber >= 2) {
			//I think we want a blanket condition that if they have given N falsely
			//when asked for other Ns at least two times
			//they do not know N
			KLMatrix[AskNumber-1] = -1;
		}
		if (NumTrials >2 && NumSuccesses/NumTrials < 2/3) {
			//if they've been asked about N more than 2 times
			//and if the ratio of successes to number of trials is less than 2/3
			//child likely doesn't know N
			KLMatrix[AskNumber-1] = -1;
		}
		if (NumTrials > 1 && NumSuccesses / NumTrials >= 2/3) {
			//if they have been asked about N before, and if of the times that they have been asked, they are correct at least 2/3 of the time
			//they might know N - we're checking this below
			if (NumTrials >= 2 && NumSuccesses/(NumSuccesses + NumFailures) < 2/3) {
				//if we have at least 2 trials worth of data for that number
				//and if the ratio of successes to (successes + failures) < 2/3
				//they do not know N
				//update the KLMatrix for this asknumber to -1
				KLMatrix[AskNumber-1] = -1;
			} else if (NumTrials >= 2 && NumSuccesses/(NumSuccesses + NumFailures) >= 2/3) {
				//(NumSuccesses / (NumSuccesses + NumFalseAskNumber) >= 2/3)
				//We also need to make sure that this child is not falsely giving N more than 2/3 of the time
				//when asked for another N
				//so we need to calculate the number of trials the child has been asked about other Ns
				//and the number of times that the child has falsely given that N
				//we can calculate number of times child was asked about other Ns by taking current trial num, and subtracting the number of times asked
				//about this N
				if (NumFalseAskNumber/(Params.CurrTrial - NumTrials) >= 2/3) {
					//if, of the number of times that a child has been asked about other Ns
					//they have given that N falsely for other Ns more >= 2/3 of the time
					//then they do not know N
					KLMatrix[AskNumber-1] = -1;
				}
				KLMatrix[AskNumber-1] = 1;//otherwise, they know N
			}
		}
	}

		// now we're going to assign KLs
		// this is for the titrated version, which will check on every trial
			if (KL == 1000 && type == "titrated") { 
				if (StartNumber == 1 && KLMatrix[0] == -1) {
					//add a check for if the start number is 1 & the first number in KLMatrix is -1
					//this means that they are a 0-knower
					KL = 0;
					Params.KL = 0;
				}
				if (KLMatrix[AskNumber-1] == 1 && AskNumber == HighestTestNumber) {
					//if child is succeeding on N
				// 		//And if that N is the Highest Test number
				// 		//Set KL to this
			            KL = HighestTestNumber;
			            Params.KL = HighestTestNumber;
			    } else if (KLMatrix[AskNumber-1] == 1 && KLMatrix[AskNumber] == -1) {
		        	//if child is succeeding on N, but they fail on N+1,
		        	//Set their KL to N
		        	KL = AskNumber;
		        	Params.KL = AskNumber;
		        } else if (KLMatrix[AskNumber-1] == -1) { //if child is failing on N
		        	// and if n= 1, sets KL to 0 (since child is failing at 1)
		        	if (AskNumber == 1) { 
		        		KL = 0;
		        		Params.KL = 0;
		        	} else if (KLMatrix[AskNumber - 2] == 1){ //if the child is failing criteria for n
		        		//but if they succeeded on the number below that AskNumber
		             	//Set their KL to Asknumber -1
		             	KL = AskNumber-1;
		             	Params.KL = AskNumber-1;
		        	} else { //otherwise, keep going...
		        		KL =1000;
		        	}
	        	}
	    	}


	//the following is setting a max number based on either the current ask number
	//or the current response
	//it is, for every trial, checking the KL matrix, seeing if a -1 has been assigned
	//if so, we are not testing any numbers beyond this in the TITRATED version
	if (KLMatrix[AskNumber-1] == -1) {
		Params.maxNumber = AskNumber;
		maxNumberInit = 1;
	} else if (KLMatrix[Ans-1] == -1) {
		Params.maxNumber = Ans;
		maxNumberInit = 1;
	} 

	//now we need to determine what the next number tested will be
	//in the titrated version 
	//Assumptions: If child demonstrates that they do not know N, numbers ABOVE that N will not be tested

	if (KL == 1000 && type == "titrated") {
		//set hold on ask number from the current trial
		PreviousAskNumber = AskNumber; 
		//if we have not determined the maximum number that a child knows, 
		//then it's business as usual 
			if (Params.maxNumber == null) {
				//if child gives a correct answer on the current trial
				if(Ans == AskNumber) {
					//and if the current number is not the highest test number
					//increase AskNumber (for next trial) by 1
					if (AskNumber != HighestTestNumber) {
						AskNumber = AskNumber +1;
					} else if (AskNumber == HighestTestNumber) {
						//if the current number is the highest test number, decrease by 1
						AskNumber = AskNumber-1;
					} 
				} else if (Ans != AskNumber) { 
					//if the child gets the current answer incorrect
					if (AskNumber != 1) {
					//if the current trial is not 1, decrease AskNumber by 1
						AskNumber = AskNumber-1;
					} else if (AskNumber == 1) {
						//if the current number is 1, go up to 2
						AskNumber = AskNumber+1;
					}
				}
			} else if (Params.maxNumber != null) {
				//if have determined a maximum number that the child knows
				//then we will not test any numbers that are above this maximum
				//let's start with incorrect because it's easier to work through
				if (Ans != AskNumber) {
					if (maxNumberInit == 1) { //if this is the first trial after we set the max number
						if (AskNumber >= Params.maxNumber) {
							if (AskNumber == 1 && Params.maxNumber != 1) { // if the current number is 1 and the max number is not 1
								AskNumber = AskNumber +1; //then we test 2
								maxNumberInit = 0;
							} else if (Params.maxNumber == 1) {
								//if the max number is one, we're going to ask for 1 again
								AskNumber = 1;
								maxNumberInit =0;
							} else {
								//otherwise, we're going to go one less than the maxnumber
								AskNumber = Params.maxNumber -1;
								maxNumberInit = 0;
							}
						} else if (AskNumber < Params.maxNumber) { //if the asknumber is less than the maxnumber
							if (AskNumber == 1 && Params.maxNumber != 1) { // if the current number is 1 and the max number is not 1
								AskNumber = AskNumber +1; //then we test 2
								maxNumberInit = 0;
							} else if (AskNumber == Params.maxNumber -1) {//if the current asknumber is 1 less than the maxnumber
								AskNumber = AskNumber - 1; //we will go down
								maxNumberInit = 0;
							} else  { //otherwise
								AskNumber = AskNumber - 1; //then go down
								maxNumberInit = 0;
							}
						} 
					} else { //if this is not the first time after we've set a max number
						if (AskNumber != 1) { //if the current N is not 1
								AskNumber = AskNumber -1; //we go down by 1
						} else if (AskNumber == 1 && AskNumber + 1 < Params.maxNumber) { //if the current N is 1, we want to go up, but only if that's less than the maxnumber
								AskNumber = AskNumber+1;
						} else if (Params.maxNumber == 1) { //if the maxnumber is 1, we just test 1 again
								AskNumber = AskNumber;
						} else if (AskNumber == 1 & AskNumber + 1 >= Params.maxNumber) { //if the max number is 2, and we're on 1
								AskNumber = AskNumber; //test 1 again
						}
					}
				} else if (Ans == AskNumber) { //if the child is correct
					if (AskNumber+1 < Params.maxNumber) { //if we can go up, we will
							AskNumber = AskNumber+1;
					} else if (AskNumber == HighestTestNumber) { //if current N is the highest test number, we go down 1
							AskNumber = AskNumber-1;
					} else if (AskNumber +1 >= Params.maxNumber) { //if going up would put us out of range of the maxnumber, then go down
							if (AskNumber == 1) { //if the current number is 1, just repeat it
								AskNumber = AskNumber;
							} else {
								AskNumber = AskNumber-1; //otherwise, go down 1
							}
					} 
				}
			}
		}
	
		//non-titrated logic
		//non-titrated set is already shuffled, we just need to progress through the array
		if (type == "nontitrated") {
			if (Params.CurrTrial-1 < nonTitratedSet.length) { //if we still have numbers to test
				AskNumber = nonTitratedSet[Params.CurrTrial-1]; //then we are going to progress
			} else { //if we are on the last trial
				for (var k = 0; k < KLMatrix.length; k++) {
					if (KLMatrix[k] == -1) {
						//if we reach a number the child doesn't know
						//then their KL is the number BELOW that number
						if (k == 0) {
							KL = 0;
							Params.KL = 0;
						} else {
							KL = k-1;
							Params.KL = k-1; 
						}
						break;
					} else if (k+1 == KLMatrix.length && KLMatrix[k] == 1) {
						//if we've made it to the last number
						//and they are all correct
						//then child is that N-knower
						KL = k+1;
						Params.KL = k+1;
						break;
					}
				}
			}
		}

    if ((type ==='nontitrated' && (Params.CurrTrial-1)==nonTitratedSet.length) || type ==='titrated'){

        // if KL is higher then 4, we typically categorize the child as a
        // "CP-knowers" because if the child knows 1-5, they are highly likely to be
        // a CP knowers and errors are more likely to result from simple
        // carelessness. This prints out "CP" in addition to numerical KL for KLs>4.
        var ie_KL = null;
        if (KL > 4 && KL < 1000) {
            ie_KL = 'CP';
        } else
            ie_KL = KL;
       	 KnowerLevelResult.KL = KL;
       	 KnowerLevelResult.ie_KL = ie_KL;
    }

    return AskNumber;
}

