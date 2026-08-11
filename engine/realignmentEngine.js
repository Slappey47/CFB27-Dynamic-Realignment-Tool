// comments here - this is my engine for realignment fucntions

const { recordSnapshot, loadHistory } = require('../io/pipelineHistory');


const { SCHOOL_COORDS, SCHOOL_CONF, haversineMiles } = require('../data/schoolCoordinates');

function defaultSettings() {
    
  return {
    prestigeAvgLength: 5, //how many years of Prestige history are considered
    prestigedecay: 0.2,

    dConfTenureWeight: 0.5,
    sTenureWeight: 100,
    dconfPrestigeWeight: 50,
    sPrestigeWeight: 100,
    sGeoWeight: 100,
    dconfGeoWeight: 1/10,
    dconfStabilityWeight:25,
    sconfStabilityWeight:100,
    dteamTenureWeight: 0.5,
    dteamPrestigeWeight: 50,
    dteamGeoWeight: 1/10,
    dinviteThresholdBaseline: -25,
    dexpelThresholdBaseline: 100,
    dexpediteFee: 75,
    sexpediteFee: 100,
    dconfSizeDesire: 20,
    sconfSizeDesire: 100,
    confDesiredSize: {"ACC":16, "SEC": 16,"Big Ten":16,"Big 12":16,"Pac-12":12, "American":12,"CUSA":12,"MWC":12,"MAC":12,"Sun Belt":12,},
    applicationProcessingLength: 3,
    dEvenDesire: 75,
    sEvenDesire: 100,
    moratoriumPeriod: 1,
    NDlock : 1,
    hawaiiBonus: 200,
      };
}

function setBaseline(teamsByIndex,confArray,season,settings){
    for(const team of teamsByIndex){
        for(let i =0; i<settings.prestigeAvgLength; i++){
            team.prestigeHistory.push(team.currentPrestige);
        };
    };
    for(const conf of confArray){
        conf.applicationStatus = [];
        conf.tenures = [];
        for(let j=0;j<conf.memberRecords.length;j++){
            const t = String(conf.memberRecords[j].DisplayName);
            console.log(t);
            const c = SCHOOL_CONF[t][0];
            teamsByIndex[conf.memberRecords[j].TeamIndex].confName = conf.Name;
            if(c == conf.Name){
                conf.tenures.push(season-SCHOOL_CONF[t][1]);
                teamsByIndex[conf.memberRecords[j].TeamIndex].confTenure = season-SCHOOL_CONF[t][1];
            } else{
                conf.tenures.push(0);
                teamsByIndex[conf.memberRecords[j].TeamIndex].confTenure = 0;

            };
        };
       
    };
    for(const conf of confArray){
         for(const team of teamsByIndex){
            if(team.confName==conf.Name){
                conf.applicationStatus.push([team.displayName,100]);
            }else{
                conf.applicationStatus.push([team.displayName,0]);
            }
            

        };
    };
}

function pullHistory(teamsByIndex,confArray,season,hist,dynastyCode,settings,curr){
    for(const team of teamsByIndex){
        team.prestigeHistory.push(team.currentPrestige);
        //console.log(typeof hist[dynastyCode]);
        //console.log(typeof hist[dynastyCode][team.displayName]);
        //console.log(typeof hist[dynastyCode][team.displayName][String(season-1)][0]);
        //console.log(team.displayName);
        //console.log(hist[dynastyCode][team.displayName][String(season-1)]);
        
        
        for(let i =1; i<settings.prestigeAvgLength; i++){
            team.prestigeHistory.push(hist[dynastyCode][team.displayName][String(season)][i-1]);
        };
    };
    for(const conf of confArray){
        
        conf.tenures = hist[dynastyCode][conf.Name+"Tenures"][String(season)];
        for(let j=0;j<conf.memberRecords.length;j++){
            const t = String(conf.memberRecords[j].DisplayName);
            const c = conf.Name;
            const c2 = hist[dynastyCode][t+"Conf"][String(season)]
            const ten = conf.tenures[j];
            teamsByIndex[conf.memberRecords[j].TeamIndex].confName = conf.Name;
            if(c == c2){
                conf.tenures[j] = parseFloat(conf.tenures[j]) + (parseFloat(curr)-parseFloat(season));
                teamsByIndex[conf.memberRecords[j].TeamIndex].confTenure = conf.tenures[j];
            } else{
                conf.tenures[j] = 0;
                teamsByIndex[conf.memberRecords[j].TeamIndex].confTenure = 0;

            };
        };
       
    };
    for(const conf of confArray){
         conf.applicationStatus = hist[dynastyCode][conf.Name][String(season)];
    };

}



//establish interest in various conferences...
//prestige average
// i feel like I need to have other things here too...
function setupTeams(settings,teamsByIndex, confArray){
    //prestige average
    for(const team of teamsByIndex){
        let w = 1;
        let p = 0;
        let q =0;
        for(let i=0; i<settings.prestigeAvgLength; i++ ){
            p+= (w - (settings.prestigedecay*i))*team.prestigeHistory[i];
            q+= (w - (settings.prestigedecay*i));
        };
        team.prestigeAVG = p/q;
    };
    //set up conference interest array
    for(const team of teamsByIndex){
        team.confInterest = [];
        for (const conf of confArray){
            const temp = [];
            temp.push(conf.Name);
            temp.push("insert prestige here");
            if(conf.Name == "Independent"){
                temp.push(0);//miles
                if(conf.Name== team.confName){
                    temp.push(team.confTenure);
                }else{
                    temp.push(0);
                };
            }else if(conf.Name== team.confName){
                let miles = 0;
                let n = 0;
                let h = 0;
                if(team.displayName == "Hawai'i"){h=1};
                let hb = h *settings.hawaiiBonus;
                for(const opp of conf.memberRecords){
                    if(opp.DisplayName==team.displayName){
                    }else{
                        n+= 1;
                        miles+= haversineMiles(SCHOOL_COORDS[opp.DisplayName],SCHOOL_COORDS[team.displayName])-hb;
                    };
                };
                team.confDist = miles/n;
                temp.push(miles/n);
                temp.push(team.confTenure);
            }else{
                let miles = 0;
                let n = 0;
                let h = 0;
                if(team.displayName == "Hawai'i"){h=1};
                let hb = h *settings.hawaiiBonus;
                for(const opp of conf.memberRecords){
                    n+= 1;
                    miles+= haversineMiles(SCHOOL_COORDS[opp.DisplayName],SCHOOL_COORDS[team.displayName])-hb;
                };
                temp.push(miles/n);
                temp.push(0);
            };
            team.confInterest.push(temp);
        };
        //console.log(team.displayName);
        //console.log(team.confInterest);
    };    
                            
}

// hmmmm i wonder if i should handle thresholds, buckets, etc. in this function or another one
function performanceReview(settings,teamsByIndex,confArray){
    //console.log("hello");
    for (const conf of confArray){
        conf.prestiges = [];
        conf.distances =[];
        conf.appeals = [];
        conf.appealDeltas = [];
        conf.currentsize = 0;
        conf.oddStatus = conf.currentsize % 2
        for(const opp of conf.memberRecords){
            for(const t of teamsByIndex){
                if(opp.DisplayName==t.displayName){
                    conf.prestiges.push(t.prestigeAVG);
                    conf.distances.push(t.confDist);
                    break;
                };
            };
            conf.currentsize++;                                                                                  
        }; 
        let sum = 0;
        let num = 0;
        for(const val of conf.prestiges ){
            sum+= val;
            num++;
        };
        conf.confAVGPrestige = sum/num;
        sum = 0;
        num = 0;
        for(const val of conf.tenures ){
            sum+= val;
            num++;
        };
        conf.confAVGTenure = sum/num;
        sum = 0;
        num = 0;
        for(const val of conf.distances ){
            sum+= val;
            num++;
        };
        conf.confAVGDistance = sum/num;
        conf.confAVGAppeal = (conf.confAVGPrestige*settings.confPrestigeWeight)+(conf.confAVGTenure*settings.confTenureWeight)-(conf.confAVGDistance*settings.confGeoWeight);
        let j = conf.prestiges.length;
        for(let i =0; i<j;i++){
            const temp = (conf.prestiges[i]*settings.confPrestigeWeight)+(conf.tenures[i]*settings.confTenureWeight)-(conf.distances[i]*settings.confGeoWeight);
            conf.appeals.push(temp);
            conf.appealDeltas.push(temp-conf.confAVGAppeal);
        };

    };
}

//next is send applications i think... then probably review applications, then calc moves... then execute moves....

function sendApplications(settings, teamsByIndex,confArray){
    //console.log("hi67");
    for(const team of teamsByIndex){
        let i=0;
        for (const conf of confArray){//calculate appeals
            team.confInterest[i][1] = conf.confAVGPrestige;
            let temp=0;
            if(conf.Name == "Independent"){
                temp = 0;
                if(team.displayName == "Notre Dame"&&settings.NDlock==1){temp = 1000000;}
                team.confInterest[i].push(temp); // for now, teams don't want to be independent at all. I might chnage this
            }else{
                temp = (team.confInterest[i][1]*settings.teamPrestigeWeight)+(team.confInterest[i][3]*settings.teamTenureWeight)-(team.confInterest[i][2]*settings.teamGeoWeight);
                team.confInterest[i].push(temp);
            }
            if(conf.Name == team.confName){
                team.currentConfAppeal = temp;
            }
            i++;
        };
        i=0;
        for (const conf of confArray){// compare to current conf
            if(team.displayName == "Notre Dame"&&settings.NDlock==1){
                team.confInterest[i].push(-1);
            }
            else if(team.confInterest[i][4] > team.currentConfAppeal){
                team.confInterest[i].push(1);
                //team.confInterest[i].push(team.confInterest[i][4]);
            }else if(team.confInterest[i][4] == team.currentConfAppeal){
                team.confInterest[i].push(0);
                //team.confInterest[i].push(team.currentConfAppeal);
            }else{
                team.confInterest[i].push(-1);
                //team.confInterest[i].push(team.confInterest[i][4]);
            }
            i++;
        };
        //console.log(team.displayName);
        //console.log(team.confInterest);
    };
}


function reviewApplications(settings, teamsByIndex,confArray){
    for (const conf of confArray){
        //console.log("pre: "+conf.Name);
        for(const q of conf.applicationStatus){
            if(q[1]!=0 &&q[1]!=100){
                //console.log(q);
            }
        }
    
        
        for (const team of conf.applicationStatus){
            conf.desiredSize =settings.confDesiredSize[conf.Name];
            let teamInterest = 0;
            let tp =0;
            let td =0;
            for(const t of teamsByIndex){
                if(t.displayName == team[0]){
                    for(const c of t.confInterest){
                        if(c[0]==conf.Name){
                            teamInterest = c[5];
                            td = c[2];
                            break;
                        }
                    };
                    tp = t.prestigeAVG;
                    
                    break;
                }

            };
            conf.eThresh =  conf.confAVGAppeal - (settings.expelThresholdBaseline - (conf.oddStatus*settings.evenDesire) - ((conf.currentsize-conf.desiredSize)*settings.confSizeDesire));
            conf.iThresh = conf.confAVGAppeal + ( settings.inviteThresholdBaseline - (conf.oddStatus*settings.evenDesire) + ((conf.currentsize-conf.desiredSize)*settings.confSizeDesire));
            if(conf.memberNames.includes(team[0])){
                if(team[1]<50){team[1]=100};
                //const thresh =  conf.confAVGAppeal -(settings.expelThresholdBaseline - (conf.oddStatus*settings.evenDesire) - ((conf.currentsize-conf.desiredSize)*settings.confSizeDesire);
                let x =settings.applicationProcessingLength;
                let z = conf.appeals[conf.memberNames.indexOf(team[0])];
                team[2]=z;
                let m = -10000;
                for(let y = 0; y<(2*x); y++){
                    let a = conf.eThresh - (settings.expediteFee*(x-y-1));
                    if(z<a){
                        m = x-y;
                        /**console.log(team[0]);
                        console.log(team[1]-m);
                        console.log(z);
                        console.log(a);
                        console.log(m);**/
                        break;
                    }
                };
                if((team[1]-m)>100){
                    //console.log("A");
                    team[1]=100;
                }else if((team[1]-m)<(100-settings.applicationProcessingLength)){
                    //console.log("B");
                    team[1]= 100-settings.applicationProcessingLength;
                }else{
                    //console.log("c");
                    team[1]-= m;
                }
            }else if(teamInterest<1){
                //console.log(team[0]);
                //console.log("no interest");
                team[1]=0;
            }else{
                //const thresh = conf.confAVGAppeal + ( settings.inviteThresholdBaseline - (conf.oddStatus*settings.evenDesire) + ((conf.currentsize-conf.desiredSize)*settings.confSizeDesire));
                let x =settings.applicationProcessingLength;
                let z = (tp*settings.confPrestigeWeight)-(td*settings.confGeoWeight);
                team[2]=z;
                let m = -10000;
                for(let y = 0; y<(2*x); y++){
                    let a = conf.iThresh + (settings.expediteFee*(x-y-1));
                    if(z>a){
                        m = x-y;
                        break;
                    }
                };
                if((team[1]+m)<0){
                    team[1]=0;
                }else if((team[1]+m)>settings.applicationProcessingLength){
                    team[1]= settings.applicationProcessingLength;
                }else{
                    team[1]+= m;
                }
            }
        }
        //console.log(conf.Name);
        for(const q of conf.applicationStatus){
            if(q[1]!=0 &&q[1]!=100){
                //console.log(q);
            }
        };
    }
}

function calculateMoves(settings, teamsByIndex,confArray,baselineSeason,season){
    const movesArray =Array();
    for (const conf of confArray){
        if(conf.Name =="Independent"){
        }else if (settings.moratoriumPeriod + baselineSeason > parseFloat(season)) {
            conf.moves = [];
            conf.moves.push([conf.Name,null,null,null,null,0,0]);
            movesArray.push(conf.moves[0]);

        }else{
            const wantlist = [];
            const hatelist = [];
            let want = 0;
            let hate = 0;
 
            for (const team of conf.applicationStatus){
                if(team[1]==settings.applicationProcessingLength){
                    wantlist.push(team);
                    want++;
                }
                if(team[1]==(100-settings.applicationProcessingLength)){
                    hatelist.push(team);
                    hate++;
                }
                

            };
            wantlist.sort((a,b)=>{return b[2]-a[2];});
            hatelist.sort((a,b)=>{return a[2]-b[2];});
            /** 
            console.log(conf.Name);
            console.log("want");
            console.log(wantlist);
            console.log("hate");
            console.log(hatelist); */
            let flipodd =0;
            if(conf.oddStatus==0){
                flipodd = 1
            }
            conf.moves = [];
            let num = -(conf.oddStatus*settings.evenDesire) - ((Math.abs(conf.currentsize-conf.desiredSize))*settings.confSizeDesire);
            conf.moves.push([conf.Name,null,null,null,null,num,0]);
            if(want>=2){
                let num = wantlist[0][2]+wantlist[1][2]-(2*conf.iThresh) -(2*settings.confStabilityWeight) - ((Math.abs((conf.currentsize+2)-conf.desiredSize))*settings.confSizeDesire)-(conf.oddStatus*settings.evenDesire);
                conf.moves.push([conf.Name,wantlist[0][0],wantlist[1][0],null,null,num,0]);

            }
            if(want>=1){
                let num = wantlist[0][2]-conf.iThresh-settings.confStabilityWeight - ((Math.abs((conf.currentsize+1)-conf.desiredSize))*settings.confSizeDesire)-(flipodd*settings.evenDesire);
                conf.moves.push([conf.Name,wantlist[0][0],null,null,null,num,0]);
            }
            if(hate>=2){
                let num = -hatelist[0][2]-hatelist[1][2]+(2*conf.eThresh) -(2*settings.confStabilityWeight) - ((Math.abs((conf.currentsize-2)-conf.desiredSize))*settings.confSizeDesire)-(conf.oddStatus*settings.evenDesire);
                conf.moves.push([conf.Name,null,null,hatelist[0][0],hatelist[1][0],num,0]);

            }
            if(hate>=1){
                let num = -hatelist[0][2]+conf.eThresh-settings.confStabilityWeight - ((Math.abs((conf.currentsize-1)-conf.desiredSize))*settings.confSizeDesire)-(flipodd*settings.evenDesire);
                conf.moves.push([conf.Name,null,null,hatelist[0][0],null,num,0]);
            }
            if(want>=2&&hate>=2){
                let num = wantlist[0][2]+wantlist[1][2]-(2*conf.iThresh)-hatelist[0][2]-hatelist[1][2]+(2*conf.eThresh) -(4*settings.confStabilityWeight) -(conf.oddStatus*settings.evenDesire);
                conf.moves.push([conf.Name,wantlist[0][0],wantlist[1][0],hatelist[0][0],hatelist[1][0],num,0]);
            }
            if(want>=1&&hate>=1){
                let num = wantlist[0][2]-(1*conf.iThresh)-hatelist[0][2]+(conf.eThresh) -(2*settings.confStabilityWeight) -(conf.oddStatus*settings.evenDesire);
                conf.moves.push([conf.Name,wantlist[0][0],null,hatelist[0][0],null,num,0]);
            }
            conf.moves.sort((a,b)=>{return b[5]-a[5];});
            /** 
            console.log(conf.Name);
            console.log(conf.moves);
            console.log(conf.iThresh);
            console.log(conf.eThresh);*/
            movesArray.push(conf.moves[0]);
        } 
    };
    return movesArray;

}


function executeMoves(teamsByIndex,confArray,moves){
    const invites = [];
    for(const move of moves){
        if(move[6]==0){
            if(move[1]!=null){
                invites.push([move[0],move[1]])
            }
            if(move[2]!=null){
                invites.push([move[0],move[2]])
            }
        }
    };

    for(const invite of invites){
        for(const team of teamsByIndex){
            if(team.displayName==invite[1]){
                for(const c of team.confInterest){
                    if(c[0]==invite[0]){
                        invite.push(c[6]);
                        break;
                    }
                };
            }
        };
    };
    invites.sort((a,b)=>{return b[6]-a[6];});
    const refer = [];
    const acceptedInvites =[];
    for(const invite of invites){
        if(refer.includes(invite[1])){
        }else{
            refer.push(invite[1]);
            acceptedInvites.push([invite[0],invite[1]]);
        }
        
    };
    return acceptedInvites;
}

function validateMoves(moves, acceptedInvites){
    let valid =0;
    //console.log(moves);
    
    for(const move of moves){
        if(move[6]==1){

        }else{

        
        let temp = 1;
        //console.log("hellothere");
        //console.log(move);
        move[6]=1;
        const arr = [];
        for(const inv of acceptedInvites){
            if(move[0]== inv[0] ){
                arr.push(inv[1]);
            }
        };

        if(move[1]==null){
            //console.log("hellothere");
        }else if(arr.includes(move[1])){
        }else{
            temp=0;
            move[6]=0;
            //console.log(move[1]);
        }

        if(move[2]==null){
            //console.log("hellothere");
        }else if(arr.includes(move[1])){
        }else{
            temp=0;
            move[6]=0;
            //console.log(move[2]);
        }
        valid+= move[6];
    }
        
    }
    return valid;
}

function recalculateMoves(settings, teamsByIndex,confArray,oldmoves,accepted){
    const movesArray =[];
    //console.log(oldmoves);
    let k = 0;
    //const arr = [];
   // for(const move of oldmoves){
      //  arr.push(move[6]);
  //  };

    
    for (const conf of confArray){
        let r = 0;
        let p = 0;
        for(const move of oldmoves){
            if(move[0]==conf.Name){
                r= move[6];
                break;
            }
            p++;
        };
        
        if(conf.Name =="Independent"){
        }else if(r==1){
            movesArray.push(oldmoves[p]);
            //console.log("validated");
            //console.log(conf.Name);
            //console.log(oldmoves[p]);

        }else{
            const wantlist = [];
            const hatelist = [];
            let want = 0;
            let hate = 0;
 
            for (const team of conf.applicationStatus){
                let accept =0;
                for(const t of accepted){
                    if(t[1]==team[0]){
                        accept= 1;
                        //console.log("accepted");
                    }
                    //console.log(t[1]);
                    //console.log
                };
                if(team[1]==settings.applicationProcessingLength && accept==0){
                    wantlist.push(team);
                    want++;
                }
                if(team[1]==(100-settings.applicationProcessingLength)){
                    hatelist.push(team);
                    hate++;
                }
                

            };
            wantlist.sort((a,b)=>{return b[2]-a[2];});
            hatelist.sort((a,b)=>{return a[2]-b[2];});
            /** 
            console.log(conf.Name);
            console.log("want");
            console.log(wantlist);
            console.log("hate");
            console.log(hatelist); */
            let flipodd =0;
            if(conf.oddStatus==0){
                flipodd = 1
            }
            conf.moves = [];
            let num = -(conf.oddStatus*settings.evenDesire) - ((Math.abs(conf.currentsize-conf.desiredSize))*settings.confSizeDesire)
            conf.moves.push([conf.Name,null,null,null,null,num,0]);
            if(want>=2){
                let num = wantlist[0][2]+wantlist[1][2]-(2*conf.iThresh) -(2*settings.confStabilityWeight) - ((Math.abs((conf.currentsize+2)-conf.desiredSize))*settings.confSizeDesire)-(conf.oddStatus*settings.evenDesire);
                conf.moves.push([conf.Name,wantlist[0][0],wantlist[1][0],null,null,num,0]);

            }
            if(want>=1){
                let num = wantlist[0][2]-conf.iThresh-settings.confStabilityWeight - ((Math.abs((conf.currentsize+1)-conf.desiredSize))*settings.confSizeDesire)-(flipodd*settings.evenDesire);
                conf.moves.push([conf.Name,wantlist[0][0],null,null,null,num,0]);
            }
            if(hate>=2){
                let num = -hatelist[0][2]-hatelist[1][2]+(2*conf.eThresh) -(2*settings.confStabilityWeight) - ((Math.abs((conf.currentsize-2)-conf.desiredSize))*settings.confSizeDesire)-(conf.oddStatus*settings.evenDesire);
                conf.moves.push([conf.Name,null,null,hatelist[0][0],hatelist[1][0],num,0]);

            }
            if(hate>=1){
                let num = -hatelist[0][2]+conf.eThresh-settings.confStabilityWeight - ((Math.abs((conf.currentsize-1)-conf.desiredSize))*settings.confSizeDesire)-(flipodd*settings.evenDesire);
                conf.moves.push([conf.Name,null,null,hatelist[0][0],null,num,0]);
            }
            if(want>=2&&hate>=2){
                let num = wantlist[0][2]+wantlist[1][2]-(2*conf.iThresh)-hatelist[0][2]-hatelist[1][2]+(2*conf.eThresh) -(4*settings.confStabilityWeight) -(conf.oddStatus*settings.evenDesire);
                conf.moves.push([conf.Name,wantlist[0][0],wantlist[1][0],hatelist[0][0],hatelist[1][0],num,0]);
            }
            if(want>=1&&hate>=1){
                let num = wantlist[0][2]-(1*conf.iThresh)-hatelist[0][2]+(conf.eThresh) -(2*settings.confStabilityWeight) -(conf.oddStatus*settings.evenDesire);
                conf.moves.push([conf.Name,wantlist[0][0],null,hatelist[0][0],null,num,0]);
            }
            conf.moves.sort((a,b)=>{return b[5]-a[5];});
            /** 
            console.log(conf.Name);
            console.log(conf.moves);
            console.log(conf.iThresh);
            console.log(conf.eThresh);*/
            movesArray.push(conf.moves[0]);
        }
        k++; 
    };
    return movesArray;

}
function moveSummary(moves){
    const summary =[];
    const teams = [];
    for(const move of moves){
        if(move[1]!=null){
            summary.push([move[0],move[1]]);
            teams.push(move[1]);
        }
        if(move[2]!=null){
            summary.push([move[0],move[2]]);
            teams.push(move[2]);
        }
    };
    for(const move of moves){
        if(move[3]!=null){
            if(!teams.includes(move[3])){
                summary.push(["Independent",move[3]]);
            }
        }
        if(move[4]!=null){
            if(!teams.includes(move[4])){
                summary.push(["Independent",move[4]]);
            }
        }
    };/*
    for(const sum of summary){
        for( const team of teams){

        };

    };*/
    return summary;

}

function recordSnapshots(teamsbyIndex,confArray,season,dynastyCode,app){
    for(const team of teamsbyIndex){
        recordSnapshot(app,dynastyCode,season,team.displayName,team.prestigeHistory);
        recordSnapshot(app,dynastyCode,season,team.displayName+"Conf",team.confName);
    }
    for(const conf of confArray){
        recordSnapshot(app,dynastyCode,season,conf.Name,conf.applicationStatus);
        recordSnapshot(app,dynastyCode,season,conf.Name+"Tenures",conf.tenures);
    }


}

module.exports = {                         
    setBaseline,
    defaultSettings,
    setupTeams,
    performanceReview,
    sendApplications,
    reviewApplications,
    calculateMoves,
    executeMoves,
    validateMoves,
    recalculateMoves,
    moveSummary,
    recordSnapshots,
    pullHistory,
};