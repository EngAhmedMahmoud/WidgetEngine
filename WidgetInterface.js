"use strict";
const fs = require("fs");
const fs_extra = require("fs-extra");
const zipUnzipPackage = require("adm-zip");
const WidgetModel = require("./Models/widget_config"); 
const pug = require("pug");
const path = require("path");

class Widget{
    ExtractZipFile(source,dest){
        try{
            var widgetZipFile = new zipUnzipPackage(source);
            widgetZipFile.extractAllTo(dest);
            return {
                success:1
            }
        }catch(error){
            return {
                success:0,
                msg:`${source} Extracting Error!!! To ${dest}`,
                error:error
            }
        }
        
    }
    deleteFile(filePath){
        try{
            fs_extra.removeSync(path.join(__dirname,filePath));
            return {
                success:1
            }
        }catch(error){
            return {
                success:0,
                msg:`${filePath} Deleting Error!!!${error}`,
                error:error
            }
        }
        
    }
    deleteDir(dirPath){
        try{
            fs_extra.removeSync(path.join(__dirname,dirPath));
            return {
                success:1
            }
        }catch(error){
            return {
                success:0,
                msg:`${dirPath} Deleting Error!!!${error}`,
                error:error
            }
        }
    }
    renameDir(oldName,newName){
        try{
            fs.renameSync(oldName, newName);
            return {
                success:1
            }
        }catch(error){
            return {
                success:0,
                msg:`${oldName}  To ${newName} Rename Error!!! Tow directories have same variable_name`,
                error:error
            }
        }
    }
    downloadFile(tmpFilePath,data){
        try{
            fs.appendFileSync(tmpFilePath,data);
            return {
                success:1
            }
        }catch(error){
            return {
                success:0,
                msg:"Downloading error!!",
                error:error
            }
        }
    }
    removingObjectFromArray(array,object){
        if(array.length !=0){
            const index = array.indexOf(object);
            array.splice(index,1);
            return array;
        }
    }
    async checkWidgetVisiability(widgetName){
        let dbWidget = await WidgetModel.findOne({ variableName: widgetName ,visibility:true});
        if(dbWidget){
            return {
                success:1
            };
        }else{
            return {
                success:0,
                msg:"Widget Not Exist"
            };
        }

    }
    getWidgetConfiguration(widgetName){
        var configFile = `installed/${widgetName}/config.json`;
        if(fs.existsSync(configFile)){
            var configurations = JSON.parse(fs.readFileSync(configFile,"UTF-8"));
            return configurations;
        }else{
            return {
                success:0,
                msg:"configuration file not exist"
            }
        }
       
    }
    checkWidgetDirectory(widgetName){
        const widgetPath = `installed/${widgetName}`;
        if (fs.existsSync(widgetPath)) {
            return {
                success:1
            }
        }else{
            return {
                success:0,
                msg:`${widgetPath} does not exist`
            }
        }
    }
    checkDriverDependancy(widgetName){
        const dependancyDrivers = this.getWidgetConfiguration(widgetName).dep_drivers;
        const driverPath = `installed/${widgetName}/driver_dep`;
        if(dependancyDrivers){
            const dependancyDriversCount = dependancyDrivers.length;
            let driverExist = {};
            let drivers = [];
            if (fs.existsSync(driverPath)) {
                for(let i = 0; i<dependancyDriversCount;i++){
                    let driver = dependancyDrivers[i].variable_name;
                    let depDriverPath = `${driverPath}/${driver}.json`;
                    if(!fs.existsSync(depDriverPath)){
                        driverExist.success=0;
                        drivers.push(driver);
                        driverExist.errors = drivers;
                        driverExist.msg = "Driver dependancy files not exist"
                    }
                }
                if(driverExist.success === 0){
                    return driverExist;
                }else{
                    return {success:1};
                }
            }else{
                return {
                    success:0,
                    errors:`${driverPath} Not exist`
                }
            }
        }else{
            return {
                success:0,
                msg:"Check driver dependancy files"
            }
        }
    }
    checkWidgetDependancy(widgetName){
        const dependancyWidgets = this.getWidgetConfiguration(widgetName).dep_widgets;
        const widgetPath = `installed/${widgetName}/widget_dep`;
        if(dependancyWidgets){
            const dependancyWidgetsCount = dependancyWidgets.length;
            let widgetExist = {};
            let widgets = [];
            if (fs.existsSync(widgetPath) && dependancyWidgetsCount!=0) {
                for(let i = 0; i<dependancyWidgetsCount;i++){
                    let widget = dependancyWidgets[i].variable_name;
                    let depWidgetPath = `${widgetPath}/${widget.variable_name}.json`;
                    if(!fs.existsSync(depWidgetPath)){
                        widgetExist.success=0;
                        widgets.push(widget);
                        widgetExist.error = widgets;
                    }
                }
                if(widgetExist.success === 0){
                    return widgetExist;
                }else{
                    return {success:1};
                }
               
            }
            if(dependancyWidgetsCount ==0){
                return {
                    success:1
                }
            }
        }else{
            return {
                success:0,
                msg:"Check widget dependancy files"
            }
        }
    }
    checkEntryPoint(widgetName){
        const entryPoint = this.getWidgetConfiguration(widgetName).entry_point;
        const entryPath = `installed/${widgetName}/views`;
        let entryPointExist = {};
        if (fs.existsSync(entryPath)){
            let entryPintPath = `${entryPath}/${entryPoint}`;
            if(!fs.existsSync(entryPintPath)){
                entryPointExist.success = 0;
                entryPointExist.msg =`${entryPath}/${entryPoint} Not Exist`;

            }else{
                entryPointExist.success = 1;
            }
        }else{
            entryPointExist.success = 0;
            entryPointExist.msg = `${entryPath} Not Exist`;
        }
        return entryPointExist;
    }
    checkCssFiles(widgetName){
        const styles        = this.getWidgetConfiguration(widgetName).styles;
        const cssPath       = `installed/${widgetName}/assets/css`;
        
        if(styles){
            const cssFilesCount = styles.length;
            let cssExist = {};
            let css = [];
            if (fs.existsSync(cssPath)) {
                for(let i = 0; i<cssFilesCount;i++){
                    let cssFile = styles[i];
                    let cssFilePath = `${cssPath}/${cssFile}`;
                    if(!fs.existsSync(cssFilePath)){
                        cssExist.success=0;
                        css.push(cssFile);
                        cssExist.error = css;
                        cssExist.msg=`css files Not Exist`;
                    }
                }
                if(cssExist.success===0){
                    return cssExist;
                }else{
                    return {success:1};
                }
            }else{
                return{
                    success:0,
                    error:cssPath,
                    msg:`${cssPath} Not Exist`
                }
            }
        }else{
            return {
                success:1,
            }
        }

    }
    checkJsFiles(widgetName){
        const jsScripts    = this.getWidgetConfiguration(widgetName).scripts;
        const jsPath       = `installed/${widgetName}/assets/js`;
        if(jsScripts){
            const jsFilesCount = jsScripts.length;
            let jsExist = {};
            let js = [];
            if (fs.existsSync(jsPath)) {
                for(let i = 0; i<jsFilesCount;i++){
                    let jsFile = jsScripts[i];
                    let jsFilePath = `${jsPath}/${jsFile}`;
                    if(!fs.existsSync(jsFilePath)){
                        jsExist.success=0;
                        js.push(jsFile);
                        jsExist.error = js;
                        jsExist.msg="JS files Not Exist";
                    }
                }
                if(jsExist.success===0){
                    return jsExist;
                }else{
                    return {success:1};
                }
            }else{
                return {
                    success:0,
                    error:jsPath,
                    msg:`${jsPath} Not Exist`
                }
            }
        }else{
            return {success:1};  
        }
    }
    checkLangFiles(widgetName){
        const langs = this.getWidgetConfiguration(widgetName).langs;
        const langsPath = `installed/${widgetName}/langs`;
        if(langs){
            const langKeys = Object.keys(langs);
            let langsExist = {};
            let langs_files = [];
            if (fs.existsSync(langsPath)) {
                langKeys.forEach((key)=>{
                    if(langs[`${key}`] == true){
                        //check file existance
                        let langFilePath = `installed/${widgetName}/langs/${key}.locale.json`;
                        if(!fs.existsSync(langFilePath)){
                            langsExist.success=0;
                            langs_files.push(langFilePath);
                            langsExist.error = langs_files;
                            langsExist.msg = "Languages files not exist"
                        }
                    }
                });
                if(langsExist.success===0){
                    return langsExist;
                }else{
                    return {success:1};
                }
            }else{
                return {
                    success:0,
                    error:`${langsPath} Not exist`
                }
            }
        }else{
            return {
                success:0,
                error:"No langs in config files"
            }
        }
    }
    saveWidget(widgetName){
        const widgetContent = this.getWidgetConfiguration(widgetName);
        var widget = new WidgetModel();
        
        var dep_drivers = [];
        var dep_widgets = [];
        var dep_parsed = widgetContent.dep_drivers;
        dep_parsed.forEach(driver => {
        let dep = {};
        dep.variable_name = driver.variable_name;
        dep.version = driver.version;
        dep_drivers.push(dep);
        });
        var dep_parsed_w = widgetContent.dep_widgets;
        dep_parsed_w.forEach(widget => {
        let dep = {};
        dep.variable_name = widget.variable_name;
        dep.version = widget.version;
        dep_widgets.push(dep);
        });
        widget.name = (widgetContent.name) ? widgetContent.name : "";
        widget.variableName = (widgetContent.variable_name) ? widgetContent.variable_name : "";
        widget.description = (widgetContent.desc) ? widgetContent.desc : "";
        widget.version = (widgetContent.version) ? widgetContent.version : "";
        widget.minFoundationVersion = (widgetContent.min_foundation) ? widgetContent.min_foundation : "";
        widget.entry_point = (widgetContent.entry_point) ? widgetContent.entry_point : "";
        widget.location.x = (widgetContent.location && widgetContent.location.x) ? widgetContent.location.x : "";
        widget.location.y = (widgetContent.location && widgetContent.location.y) ? widgetContent.location.y : "";
        widget.size.min.width = (widgetContent.size && widgetContent.size.min && widgetContent.size.min.width) ? widgetContent.size.min.width : "";
        widget.size.min.height = (widgetContent.size && widgetContent.size.min && widgetContent.size.min.height) ? widgetContent.size.min.height : "";
        widget.size.max.width = (widgetContent.size && widgetContent.size.max && widgetContent.size.max.width) ? widgetContent.size.max.width : "";
        widget.size.max.height = (widgetContent.size && widgetContent.size.max && widgetContent.size.max.height) ? widgetContent.size.max.height : "";
        widget.langs.en_US = (widgetContent.langs && widgetContent.langs.en_US) ? widgetContent.langs.en_US : false;
        widget.langs.ar_EG = (widgetContent.langs && widgetContent.langs.ar_EG) ? widgetContent.langs.ar_EG : false;
        widget.langs.es_ES = (widgetContent.langs && widgetContent.langs.es_ES) ? widgetContent.langs.es_ES : false;
        widget.langs.de_DE = (widgetContent.langs && widgetContent.langs.de_DE) ? widgetContent.langs.de_DE : false;
        widget.langs.fr_FR = (widgetContent.langs && widgetContent.langs.fr_FR) ? widgetContent.langs.fr_FR : false;
        widget.dep_drivers = (dep_drivers) ? dep_drivers : [];
        widget.dep_widgets = (dep_widgets) ? dep_widgets : [];
        widget.styles = (widgetContent.styles) ? widgetContent.styles : [];
        widget.scripts = (widgetContent.scripts) ? widgetContent.scripts : [];
        return  widget.save().then((success)=>{
                return {
                    success:1,
                    msg:`${widgetName} saved successfully in database`
                }
                
            }).catch((error)=>{
                return {success:0,
                    msg:`${widgetName}  Not saved in database`,
                    error:error.errmsg
                };
            });
        
    }
    listAndCheckDependantDrivers(Drivers,widgetName){
        const dependancyDrivers = this.getWidgetConfiguration(widgetName).dep_drivers;
        if(dependancyDrivers){
            let drivers =[];
            const driverCount = dependancyDrivers.length;
            for(let i=0; i < driverCount;i++){
                drivers.push(dependancyDrivers[i].variable_name);
            }
            //check drivers 
           const check = (Drivers.sort().toString() == drivers.sort().toString())?true:false;
           if(check){
               return {
                   success:1,
               }
           }else{
               return{
                   success:0
               }
           }
        }else{
            return{
                success:0
            }
        }
       
    }
    listAndCheckDependantWidgets(Widgets,widgetName){
        const dependancyWidgets = this.getWidgetConfiguration(widgetName).dep_widgets;
        if(dependancyWidgets){
            let widgets =[];
            const widgetCount = dependancyWidgets.length;
            for(let i=0; i < widgetCount;i++){
                widgets.push(dependancyWidgets[i].variable_name);
            }
            //check drivers 
           const check = (Widgets.sort().toString() == widgets.sort().toString())?true:false;
           console.log(check);
           if(check){
               return {
                   success:1,
               }
           }else{
               return{
                   success:0
               }
           }
        }else{
            return{
                success:0
            }
        }
    }
    listFiles(path){
        //check path existance 
        if (fs.existsSync(path)){
            let folders = fs.readdirSync(path);
            return{
                success:1,
                folders:folders
            } 
        }else{
            return{
                success:0
            }
        }
       
    }
    async visibilityControl(widgetId){
        const visibilityVal = await WidgetModel.findById(widgetId);
        let visibilityUpdate;
        if(visibilityVal){
            if(visibilityVal.visibility == true){
                visibilityUpdate = await WidgetModel.findOneAndUpdate({_id:widgetId},{visibility:false},{new:true});
                    return {
                        success:1,
                        data:visibilityUpdate.visibility
                    }
               }else{
                visibilityUpdate = await WidgetModel.findOneAndUpdate({_id:widgetId},{visibility:true},{new:true});
                    return {
                        success:1,
                        data:visibilityUpdate.visibility
                    }
               }
        }else{
            return {
                success:0
            }
        }
       
    }
    async installedWidgets(path){
        let installed = this.listFiles(path);
        if(installed.success==0){
            return installed;
        }else{
             let widgets = await WidgetModel.find();
             let folders = installed.folders;
             let widgetsCount = widgets.length;
             let result = [];
             for(let i = 0; i < widgetsCount;i++){
                 let widgetName = widgets[i].variableName;
                 if(folders.includes(widgetName)){
                     result.push(widgetName);
                 }
             }
             if(result.length !=0){
                 return {
                     success:1,
                     installedWidgets:result
                 }
             }else{
                 return {
                     success:0,
                     installedWidgets:result
                 }
             }
        }
        
        
    }
    readDirFileContent(path){
        let filecontents = {};
        if (fs.existsSync(path)){
            let contents = fs.readdirSync(path);
                if(contents && contents.length !=0){
                    let filesCount = contents.length;
                    for(let i=0; i< filesCount; i++){
                        let fileName = contents[i].split(".")[0];
                        let content = fs.readFileSync(`${path}/${contents[i]}`, "UTF-8");
                        filecontents[fileName] = JSON.parse(content);
                    }
                    return filecontents; 
                }
        }else{
            return null;
        }
    }
    readFileContent(path){
        if(fs.existsSync(path)){
            var configurations = JSON.parse(fs.readFileSync(path,"UTF-8"));
            return {
                success:1,
                data:configurations
            };
        }else{
            return {
                success:0,
                msg:"File Not Exist"
            }
        }
    }
    getWidgetLang(widgetName){
        let langPath = `installed/${widgetName}/langs`;
        let langs   = {};
        let lang = this.readDirFileContent(langPath);
       
        if(lang != null){
            langs[`${widgetName}`] = lang;  
        }else{
            langs = null ; 
        }
        return langs;
    }
    async customPage(pageName){
        let wid = [];
        let styles = [];
        let scripts = [];
        const ramsConfig = JSON.parse(fs.readFileSync("./rams.config.json", 'utf8'));
        const pagesArray = ramsConfig.pages;
        let widgetData;
        let widgetdesc=[];
        const pagesNumber = pagesArray.length;
        for(let page = 0 ; page < pagesNumber ; page++){
            if(pagesArray[page].name == pageName){
                widgetData = pagesArray[page].widgets;
            }
        }
        if(widgetData){
            const widgetDataCount = widgetData.length;
            for(let widget = 0; widget<widgetDataCount;widget++){
                let widgetName = widgetData[widget].name;
                //checkVisiability
                let widgetVisiability = await this.checkWidgetVisiability(widgetName);
                //checkInstallation
                let widgetInstalled = this.checkWidgetDirectory(widgetName);
                if(widgetVisiability.success == 1 && widgetInstalled.success == 1){
                    widgetdesc.push(widgetData[widget]);
                    let dbWidget = await WidgetModel.findOne({ variableName: widgetName ,visibility:true});
                    widgetdesc[widget].data = dbWidget;
                    
                    //render entry point
                    if (widgetdesc[widget] && widgetdesc[widget].data && widgetdesc[widget].data.entry_point) {
                        //check if entry point exist or not 
                        let entryPointPath = path.join(__dirname,"/installed/",widgetName,"/views/", widgetdesc[widget].data.entry_point)
                        if(fs.existsSync(entryPointPath)){
                            wid[widgetName] = await pug.renderFile(entryPointPath);
                        }
                    }
                }
            }
                let outPut ={
                    wid:wid,
                    widgets: widgetdesc
                }
                if(widgetdesc.length !=0){
                    return {
                        success:1,
                        outPut
                        }
                    }else{
                        return {
                            success:0,
                        }
                    }
        }else{
            return {
                success:0
            }
        }
    }
    versionCompare(widgetName){
        let oldConfigPath        = `installed/${widgetName}/config.json`;
        let newConfigPath        = `installed/${widgetName}_upgrade/config.json`;
        let oldConfig            = this.readFileContent(oldConfigPath);
        let newConfig            = this.readFileContent(newConfigPath);
        let errors =[];
        if(oldConfig.success != 1){
            errors.push(`installed/${widgetName}/config.json Not Exist`);
        }
        if(newConfig.success != 1){
            errors.push(`installed/${widgetName}_upgrade/config.json Not Exist`);
        }
        if(foundationConfig.success != 1){
            errors.push(`rams.config.json Not Exist`);
        }
        if(errors.length != 0){
            return {
                success:0
            }
        }else{
            //version comparing
            let splittedOldVersion       = oldConfig.version.split(".");
            let splittednewVersion       = newConfig.version.split(".");
            let oldVersionMajor          = splittedOldVersion[0];
            let newVersionMajor          = splittednewVersion[0];
            if(oldVersionMajor == newVersionMajor){
                return {
                    success:1
                }
            }else{
                return {
                    success:0,
                    msg:"Version not compatible"
                }
            }        
        }

    }
    deleteDBWidget(widgetName){
        WidgetModel.delete({variableName:widgetName})
        .then((widget)=>{
           return {
               success:1,
               data:widget
           }
        })
        .catch((err)=>{
            return {
                success:0,
                error:err
            }
        })
    }
}
class Installation extends Widget{
    async install(widgetName){
        let checkWidgetDirectory  = this.checkWidgetDirectory(widgetName);
        let checkDriverDependancy = this.checkDriverDependancy(widgetName);
        let checkWidgetDependancy = this.checkWidgetDependancy(widgetName);
        let checkEntryPoint       = this.checkEntryPoint(widgetName);
        let checkCssFiles         = this.checkCssFiles(widgetName);
        let checkJsFiles          = this.checkJsFiles(widgetName);
        let checkLangsFiles       = this.checkLangFiles(widgetName)
        if(checkWidgetDirectory.success==0){
            return checkWidgetDirectory;
        }else if(checkDriverDependancy.success==0){
            return checkDriverDependancy;
        }else if(checkWidgetDependancy.success==0){
            return checkDriverDependancy;
        }else if(checkEntryPoint.success==0){
            return checkEntryPoint;
        }else if(checkCssFiles.success==0){
            return checkCssFiles;
        }else if(checkJsFiles.success==0){
            return checkJsFiles;
        }
        else if(checkLangsFiles.success == 0){
            return checkLangsFiles;
        }else{
            //get widget configuration
            let widgetSave =   await this.saveWidget(widgetName);
            if(widgetSave.success==0){
                return widgetSave;
            }else{
                return {
                    success:1,
                    msg:"widget saved and installed successfully"
                }
            }
        }
    }
    async upgrade(widgetName){

    }

}
var widgetInterface = new Installation();
module.exports = widgetInterface;

