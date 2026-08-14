const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const { pullHistory, runSingleCycle, recordSnapshots, defaults, defaultSettings,recalculateMoves,moveSummary, validateMoves, setBaseline, setupTeams,performanceReview, executeMoves, sendApplications,reviewApplications,calculateMoves } = require('./engine/realignmentEngine');

const {
  openSave,
  readTeamPipelineMapping,
  readPlayers,
  readCoaches,
  readTeamPrestige,
  readPipelineRow,
  writeUpdatedSave,
  readDynastyCode,
  readCurrentSeason,
  readConferences,
  readConferencesCycle,
  readUserTeam,
} = require('./io/saveFile');
const { recordSnapshot } = require('./io/pipelineHistory');
const regionCentroids = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/regionCentroids.json'), 'utf8'));
const teamColors = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/teamColors.json'), 'utf8'));
const stateToPipeline = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/stateToPipeline.json'), 'utf8'));

// Logo images are never bundled into the app (see build.files in package.json,
// and .gitignore) -- trademarked assets shouldn't ship inside the exe or the repo.
// Running from source: project-root/logos. Packaged: a "logos" folder the user
// creates themselves, sitting right next to the exe (outside app.asar entirely).
const LOGOS_DIR = app.isPackaged
  ? path.join(path.dirname(app.getPath('exe')), 'logos')
  : path.join(__dirname, 'logos');

const SETTINGS_PATH = () => path.join(app.getPath('userData'), 'pipeline-tool-settings.json');



function applySlidersToSettings(settings3){
  settings3.prestigedecay = 1 / settings3.prestigeAvgLength;

  settings3.confTenureWeight = settings3.dConfTenureWeight * settings3.sTenureWeight / 100;
  settings3.teamTenureWeight = settings3.dteamTenureWeight * settings3.sTenureWeight / 100;
  settings3.confPrestigeWeight = settings3.dconfPrestigeWeight * settings3.sPrestigeWeight / 100;
  settings3.teamPrestigeWeight = settings3.dteamPrestigeWeight * settings3.sPrestigeWeight / 100;
  settings3.confGeoWeight = settings3.dconfGeoWeight * settings3.sGeoWeight / 100;
  settings3.teamGeoWeight = settings3.dteamGeoWeight * settings3.sGeoWeight / 100;

  settings3.confSizeDesire = settings3.dconfSizeDesire * settings3.sconfSizeDesire / 100;
  settings3.evenDesire = settings3.dEvenDesire * settings3.sEvenDesire / 100;
  settings3.confStabilityWeight = settings3.dconfStabilityWeight * settings3.sconfStabilityWeight / 100;

  settings3.expediteFee = settings3.dexpediteFee * settings3.sexpediteFee / 100;

  settings3.inviteThresholdBaseline = settings3.dinviteThresholdBaseline + settings3.confStabilityWeight;
  settings3.expelThresholdBaseline = settings3.dexpelThresholdBaseline + settings3.confStabilityWeight; 
  settings3.hawaiiBonus = settings3.dhawaiiBonus * settings3.shawaiiBonus /100;

  settings3.confDesiredSize["ACC"] = settings3.P4confsize;
  settings3.confDesiredSize["Big Ten"] = settings3.P4confsize;
  settings3.confDesiredSize["SEC"] = settings3.P4confsize;
  settings3.confDesiredSize["Big 12"] = settings3.P4confsize;
  settings3.confDesiredSize["Pac-12"] = settings3.PAC12confsize;
  settings3.confDesiredSize["Sun Belt"] = settings3.G5confsize;
  settings3.confDesiredSize["American"] = settings3.G5confsize;
  settings3.confDesiredSize["MAC"] = settings3.G5confsize;
  settings3.confDesiredSize["MWC"] = settings3.G5confsize;
  settings3.confDesiredSize["CUSA"] = settings3.G5confsize;

  return settings3;

}

function loadUserSettings() {
  let settings3 ={};
  try {
    const raw = fs.readFileSync(SETTINGS_PATH(), 'utf8');
    settings3 = { ...defaultSettings(), ...JSON.parse(raw), ...defaults() };
  } catch {
    settings3 = defaultSettings();
  }

  applySlidersToSettings(settings3);


  return settings3;
}

function saveUserSettings(settings) {
  applySlidersToSettings(settings);

  fs.mkdirSync(path.dirname(SETTINGS_PATH()), { recursive: true });
  fs.writeFileSync(SETTINGS_PATH(), JSON.stringify(settings, null, 2));
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ---- IPC handlers ----

ipcMain.handle('select-save-file', async () => {
  const userSettings = loadUserSettings();
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select your dynasty save file',
    properties: ['openFile'],
    defaultPath: userSettings.lastSaveFolder || undefined,
  });
  if (result.canceled) return null;

  const savePath = result.filePaths[0];
  userSettings.lastSaveFolder = path.dirname(savePath);
  saveUserSettings(userSettings);
  return savePath;
});

ipcMain.handle('select-output-dir', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select output folder for the new save copy',
    properties: ['openDirectory', 'createDirectory'],
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('get-settings', () => loadUserSettings());
ipcMain.handle('save-settings', (event, settings) => {
  saveUserSettings(settings);
  return true;
});
ipcMain.handle('apply-preset', (event, { settings, presetName }) => applyPreset(settings, presetName));
ipcMain.handle('get-presets', () => PRESETS);
ipcMain.handle('get-team-colors', () => teamColors);
ipcMain.handle('get-state-to-pipeline', () => stateToPipeline);
ipcMain.handle('get-logos-dir', () => LOGOS_DIR);

const { loadHistory, deleteSeason, deleteDynastyHistory } = require('./io/pipelineHistory');
const { error } = require('console');
ipcMain.handle('get-history', () => loadHistory(app));
ipcMain.handle('delete-history-season', (event, { dynastyCode, season }) => deleteSeason(app, dynastyCode, season));
ipcMain.handle('delete-history-dynasty', (event, { dynastyCode }) => deleteDynastyHistory(app, dynastyCode));
ipcMain.handle('get-dynasty-code-for-save', async (event, { savePath }) => {
  const franchise = await openSave(savePath);
  return readDynastyCode(franchise);
});
ipcMain.handle('get-save-info', async (event, { savePath}) => {
  const franchise = await openSave(savePath);
  const dynastyCode = await readDynastyCode(franchise);
  const season = await readCurrentSeason(franchise);
  const userTeam = await readUserTeam(franchise); // not sure i need this

  return { dynastyCode, season, userTeam};
});

/**
 * Opens the save directly, reads every team's roster/coaches/prior
 * pipeline data, and runs the engine for each. Does NOT write anything --
 * the UI shows a before/after preview and requires explicit confirmation
 * before commit-changes is ever called.
 */
ipcMain.handle('run-engine', async (event, { savePath, settings }) => {

  //try{

  const franchise = await openSave(savePath);
  const teamsByIndex = await readTeamPrestige(franchise);
  const confArray = await readConferences(franchise);
  const dynastyCode = await readDynastyCode(franchise);
  const userTeam = await readUserTeam(franchise);
  const season = await readCurrentSeason(franchise);



  //console.log(userTeam);
  //console.log(teamsByIndex);
  //console.log(confArray);

  const settings2 = loadUserSettings();


  //console.log(season);


  let hist = loadHistory(app);


  let arr =[];


  
 //arr = Object.keys(hist[dynastyCode][String(teamsByIndex[0].displayName)]);

 //console.log(arr);
  

  try{
    arr = Object.keys(hist[dynastyCode][String(teamsByIndex[0].displayName)]);
     
  }catch{
    console.log("caught");
    
  }

  //try{

  let q = 0;
  for(const sea of arr){
    arr[q]= parseFloat(sea);
    q++;
  }

  arr.sort((a, b) => a - b);

let n = 0;
  let s = 0;
  const iterations = [];


  for(const sea of arr){
    if(sea==parseFloat(season)){
      s= 1;
    }
    if(String(season).substring(0,3)==String(sea).substring(0,3)){
      iterations.push(String(sea));
    }
    if(sea<parseFloat(season)){
      n++;
    }
  }
  if(s == 1){
    for( const sea of iterations){
        deleteSeason(app, dynastyCode, sea);
    }
    hist = loadHistory(app);

  }
  
  let baselineSeason = 0;


  if(n==0){
    await setBaseline(teamsByIndex, confArray,season,settings2);
    baselineSeason = parseFloat(season);
    console.log("set basline")

  }else{
    await pullHistory(teamsByIndex, confArray,String(arr[n-1]),hist,dynastyCode,settings2,season);
    baselineSeason = arr[0];

  }



  //console.log(settings2);
  await setupTeams(settings2,teamsByIndex, confArray);
  await performanceReview(settings2,teamsByIndex,confArray);
  await sendApplications(settings2, teamsByIndex,confArray);
  await reviewApplications(settings2, teamsByIndex,confArray);

  // moves = Array();

  let moves = await calculateMoves(settings2, teamsByIndex,confArray, baselineSeason, season);
  let accepted = await executeMoves(teamsByIndex,confArray,moves);
  let valid = await validateMoves(moves, accepted);
  let i = 0;

  while(valid<10&&i<10){
    moves = await recalculateMoves(settings2, teamsByIndex,confArray,moves, accepted);
    accepted = await executeMoves(teamsByIndex,confArray,moves);
    valid = await validateMoves(moves, accepted);
    i++;
    //console.log(moves);
  };

  const summary = await moveSummary(moves);

  

  await recordSnapshots(teamsByIndex,confArray,season,dynastyCode,app);

  for (const move of moves){
    for (const conf of confArray){
      if(move[0]==conf.Name){
        move.push(conf.applicationStatus);
        break;
      }
    }
  }

 
  return {moves, summary};

/*}catch{
    
      dialog.showErrorBox(
  'An Error Occurred', 
  'The application failed to run the engine.'
);
  
}*/
});


ipcMain.handle('setup-cycle', async (event, { savePath, settings }) => {
  const franchise = await openSave(savePath);
const dynastyCode =await  readDynastyCode(franchise);
const season = await  readCurrentSeason(franchise);
const teamsByIndex =  await readTeamPrestige(franchise);


let arr = []
try{
    arr = Object.keys(hist[dynastyCode][String(teamsByIndex[0].displayName)]);
  }catch{
    console.log("caught");
  }

  //try{
  let q = 0;
  for(const sea of arr){
    arr[q]= parseFloat(sea);
    q++;
  }

  arr.sort((a, b) => a - b);


  let n = 0;
  let s = 0;
  const iterations = [];


  for(const sea of arr){
    if(sea==parseFloat(season)){
      s= 1;
    }
    if(String(season).substring(0,3)==String(sea).substring(0,3)){
      iterations.push(String(sea));
    }
    if(sea<parseFloat(season)){
      n++;
    }
  }
  if(s == 1){
    for( const sea of iterations){
        deleteSeason(app, dynastyCode, sea);
    }

  }

  
  

  let originalConf = [];
  const confArray =  await readConferences(franchise);
  const settings2 = await  loadUserSettings();
  await  setBaseline(teamsByIndex, confArray,season,settings2);


  
    for(const team of teamsByIndex){
      originalConf.push([team.displayName,team.confName,team.confName])
    }
   
  //console.log("setup");
    //console.log(originalConf);

  
  

  return originalConf;

})


ipcMain.handle('run-engine-cycle', async (event, { savePath, settings, cycle, originalConf }) => {


/*
  

return await runEngineCycles(savePath,settings2,app);*/
//try{
    


    //let cycle = 0;
  let sentinel = 0;
    
  //console.log("reading save");


  const franchise =  await openSave(savePath);
  const teamsByIndex =  await readTeamPrestige(franchise);
  let confArray = [];
  if(cycle==0){confArray =  await readConferences(franchise);}else{
  confArray =  await readConferencesCycle(franchise,originalConf,teamsByIndex);}
  const dynastyCode = await  readDynastyCode(franchise);
  const userTeam =  await readUserTeam(franchise);
  const season =  await readCurrentSeason(franchise) + cycle/100;

  //console.log(userTeam);
  //console.log(teamsByIndex);  
  //console.log(season);

  //console.log("reading settings");

  const settings2 = await  loadUserSettings();
  settings2.moratoriumPeriod = 0;
  settings2.applicationProcessingLength = 1;
/*
  if(cycle ==0){
    let m = 0
    for(const team of teamsByIndex){
      originalConf[m][1]=team.confName;
      originalConf[m][2]=team.confName;
      m++;

    }
   
  }*/


    //console.log("loading history");
  
  let hist = await loadHistory(app);
  arr =[];

  //console.log("handling and reading history file");

  try{
    arr = Object.keys(hist[dynastyCode][String(teamsByIndex[0].displayName)]);
  }catch{
    console.log("caught");
  }

  //try{
  let q = 0;
  for(const sea of arr){
    arr[q]= parseFloat(sea);
    q++;
  }

  arr.sort((a, b) => a - b);

  let n = 0;

  for(const sea of arr){
    if(sea<parseFloat(season)){
      n++;
    }
  }

  //console.log(arr);
  //console.log(s);
  //console.log(n);

  let baselineSeason = 0;


  if(n==0){
    await  setBaseline(teamsByIndex, confArray,season,settings2);
    baselineSeason = parseFloat(season);
    //console.log("set basline")

  }else{
    await  pullHistory(teamsByIndex, confArray,String(arr[n-1]),hist,dynastyCode,settings2,season);
    baselineSeason = arr[0];  

  }
/*
  }catch{
      dialog.showErrorBox(
  'An Error Occurred', 
  'The application failed to read the realignment history.'
);
  }*/
/*
  if(cycle == 0){
    for(const team of teamsByIndex){
      originalConf.push([team.displayName,team.confName,team.confName])
    }
  }*/



  //console.log(settings2);
  //console.log("setup teams, perform review, send apps, review apps");
  await  setupTeams(settings2,teamsByIndex, confArray);
  await  performanceReview(settings2,teamsByIndex,confArray);
  await  sendApplications(settings2, teamsByIndex,confArray);
  await  reviewApplications(settings2, teamsByIndex,confArray);

  // moves = Array();

  //console.log("calculate, validate, execute moves");

  let moves = await  calculateMoves(settings2, teamsByIndex,confArray, baselineSeason, season);
  let accepted = await  executeMoves(teamsByIndex,confArray,moves);
  let valid = await  validateMoves(moves, accepted);
  
  let i = 0;

  //console.log("recalculating moves");

  while(valid<10&&i<10){
    moves = await  recalculateMoves(settings2, teamsByIndex,confArray,moves, accepted);
    accepted = await  executeMoves(teamsByIndex,confArray,moves);
    valid = await   validateMoves(moves, accepted);
    i++;
    //console.log(moves);
  };

  //console.log("summary generation");

  const summary =await   moveSummary(moves);
  console.log(summary);

  

   /* 
  for (const move of moves){
    for (const conf of confArray){
      if(move[0]==conf.Name){
        //console.log(conf.Name);
        //console.log(conf.applicationStatus);
        break;
      }
    }
  }*/
  //console.log(moves);
/*
  if(summary.length==0){sentinel = 1}else{

  for(const t of originalConf){
  for(const sum of summary){
    if(t[0]==sum[1]){
      t[2]= sum[0];
      break;
    }
  }
}}*/
/*
for(const team of teamsByIndex){
      team.confName = originalConf[2];
    }

*/
  //console.log("recording snapshots");

  recordSnapshots(teamsByIndex,confArray,season,dynastyCode,app);

  /*cycle ++;

  if(cycle > 10){
    console.log("cycles");
    console.log(cycle);
    sentinel =1;
  }*/

return summary;
//return originalConf;


});



/**
 * Commits previously-previewed changes. Always writes to a brand new save
 * file copy -- see writeUpdatedSave(). Your original save is never opened
 * in write mode at any point in this flow.
 */
ipcMain.handle('commit-changes', async (event, { savePath, engineResults, teamNamesToApply, outputDir, settings }) => {
  // writeUpdatedSave expects { [teamIndex]: { after: [[tier,region,value],...] } }
  // -- NOT a flat row-indexed map. It needs the full `after` array per team
  // (not pre-flattened to specific row numbers) because expansion/shrinking
  // determines the actual row numbers to write to, and that can only happen
  // once it's already open on its own working copy of the file.
  const teamUpdates = {};
  for (const teamName of teamNamesToApply) {
    const result = engineResults[teamName];
    if (!result) continue;
    teamUpdates[result.teamIndex] = { after: result.after };
  }
  // Pass 5 (automatic over-cap capacity reclamation, see saveFile.js)
  // needs to know the real cap and which teams are academy-exempt --
  // driven by the actual settings, never hardcoded, so a custom academy
  // list is respected correctly.
  const capacityReclaim = {
    maxPipelines: settings ? settings.maxPipelines : null,
    academyTeamNames: (settings && settings.academyMode) ? (settings.academyTeams || []) : [],
  };
  const writeResult = await writeUpdatedSave(savePath, teamUpdates, outputDir, capacityReclaim);

  // Read-only pass, separate from the write above, just to key this
  // season's history snapshot. Never touches write mode on the original.
  let dynastyCode = null;
  let season = null;
  let historyWarning = null;
  try {
    const readFranchise = await openSave(savePath);
    dynastyCode = await readDynastyCode(readFranchise);
    season = await readCurrentSeason(readFranchise);
  } catch (err) {
    console.error('Could not read dynasty code/season for history tracking:', err);
    historyWarning = 'This season was NOT recorded to History -- could not read the dynasty/season info from this save. The save file itself was written successfully; only History tracking failed.';
  }

  let dynastyHistorySeasonWarning = null;
  if (dynastyCode && season && writeResult && writeResult.outputPath) {
    const existingHistory = loadHistory(app);
    let maxKnownSeason = null;
    if (existingHistory[dynastyCode]) {
      for (const teamHistory of Object.values(existingHistory[dynastyCode])) {
        for (const s of Object.keys(teamHistory)) {
          const sNum = Number(s);
          if (maxKnownSeason === null || sNum > maxKnownSeason) maxKnownSeason = sNum;
        }
      }
    }
    if (maxKnownSeason !== null && Number(season) < maxKnownSeason) {
      dynastyHistorySeasonWarning =
        `Heads up: this save reports season ${season}, but this dynasty's History already has entries through ${maxKnownSeason} -- likely from a different copy of this save (a test file, a backup, etc). Applying just now updated the ${season} entry; it did not add a newer season, since this save genuinely isn't there yet.`;
    }

    try {
      const recordedTeams = new Set();

      for (const teamName of teamNamesToApply) {
        const result = engineResults[teamName];
        if (!result) continue;
        // Settings context for this season, kept separate from the
        // region data itself (see the JSDoc on recordSnapshot for why).
        // Falls back gracefully if `settings` wasn't passed for some
        // reason -- history recording for the actual pipeline data
        // shouldn't fail just because this optional context is missing.
        const meta = settings
          ? {
              targetCount: result.academyStatus ? settings.academyTargetCount : settings.maxPipelines,
              academyStatus: result.academyStatus || null,
            }
          : null;
        recordSnapshot(app, dynastyCode, season, teamName, result.after, meta);
        recordedTeams.add(teamName);
      }

      // Exempt academy teams deliberately never appear in
      // teamNamesToApply (nothing to write -- see the "Select all" skip
      // in app.js), but the season still genuinely happened for them.
      // Without this, their History timeline just stops at whatever
      // season they became exempt, while every other team keeps getting
      // a fresh entry each Apply -- confusing when comparing across
      // teams. Record the same (unchanged) snapshot for them too, on
      // every Apply, even though nothing was written to the save file.
      for (const [teamName, result] of Object.entries(engineResults)) {
        if (recordedTeams.has(teamName)) continue;
        if (result.academyStatus !== 'exempt') continue;
        const meta = settings ? { targetCount: settings.academyTargetCount, academyStatus: 'exempt' } : null;
        recordSnapshot(app, dynastyCode, season, teamName, result.after, meta);
      }
    } catch (err) {
      console.error('Failed to record history snapshot:', err);
      historyWarning = 'This season was NOT recorded to History -- writing to the local history file failed. The save file itself was written successfully; only History tracking failed.';
    }
  }

  return { ...writeResult, dynastyHistorySeasonWarning, historyWarning };
});
