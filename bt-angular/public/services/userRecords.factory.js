(function() {
    'use strict';

    angular
        .module('app')
        .factory('UserRecords', UserRecords);

    /* @ngInject */
    /*
    * This service manages the list of changes that the user makes against the security measure catalog
    */
    function UserRecords($filter) {

        ////////////////

        var service = {
            
            // config information
            profile: { name:'', baseline:''},
            

            recordDict: {},
            focusRecord: new Record(),
            focusID: focusID,
            initRecords: initRecords,
            revertRecord: revertRecord,
            changeRecord: changeRecord,
            setSysBaseline: setSysBaseline,
            dirtySubSet: dirtySubSet,
            parentSubSet: parentSubSet,
            registerFocusCallback: registerFocusCallback,


            // the record that is currently selected
            currentRecord: {
                        id:'',
                        status:'',
                        guidance:'',
                        rationale:'',
                        scopeMeasure:'',
                        enhanceMeasure:''
                    },
            // a object(used as a hash table) to bind the states (added, scoped, baseline, etc.) to the unique identifiers (AC-1, AC-2, etc.)
            lookup: {},
            // the array of records that the user has manipulated
            records: {},
            noEnhanceLookup: {}
        };
        return service;

        

        // Function that should be called as a constructor
        // Calling this without the 'new' keyword will yoeld unexpected behavior
        function Record( uid, state, dirty, baseline, family, priority, title , enhancements) {
            this.uid = uid;
            this.state = state;
            this.dirty = dirty?true:false;
            this.comments = {
                text:null,
                rationale:null,
                link:null
            };
            this.config = {
                baseline:baseline,
                family:family,
                priority:priority,
                title:title,
                enhancements:enhancements
            };
        }

        // Function that transforms the JSON data from the server into a client useful form
        function initRecords( data ) {

            for( var i = 0; i < data.length; i ++ ) {
                var temp = new Record( data[i].number[0],
                                       undefined,                                   
                                       false,    
                                       data[i]['baseline-impact'],
                                       data[i].family?data[i].family[0]:null,
                                       data[i].priority?data[i].priority[0]:null, 
                                       data[i].title?data[i].title[0]:null,
                                       null
                                       );

                if( data[i]['control-enhancements'] && 
                    data[i]['control-enhancements'][0] && 
                    data[i]['control-enhancements'][0]['control-enhancement'] ) {
                    temp.config.enhancements = [];
                    var enhanceList = data[i]['control-enhancements'][0]['control-enhancement'];
                    for( var j = 0; j < enhanceList.length; j ++) {
                        var id = enhanceList[j].number[0].replace(/[ \(\)]/g, "-")
                                                         .replace(/(.*)-$/, "$1")
                                                         .replace(/--/g, "-");
                        temp.config.enhancements.push(id);
                        var enhanceItem = new Record(  id,
                                                       undefined,                                   
                                                       false,    
                                                       enhanceList[j]['baseline-impact'],
                                                       temp.config.family,
                                                       temp.config.priority, 
                                                       enhanceList[j].title?enhanceList[j].title[0]:null,
                                                       undefined
                                                       );

                        service.recordDict[enhanceItem.uid] = enhanceItem;
                    }
                }
                service.recordDict[temp.uid] = temp;
               
            }

            console.log(service.recordDict);
        }

        // Check individual record against baseline
        function matchConfig( config, baseline) {
            for( var i = 0; i < service.profile.baseline.length; i ++ ) {
                if( config.baseline && config.baseline.indexOf( service.profile.baseline ) > -1 ) {
                    return 'base';
                }
            }
            return 'not';
        }

        // Function that initializes the state parameters of the records
        function setSysBaseline() {
            angular.forEach(service.recordDict, function(record) {
                if(!record.dirty) {
                    record.state = matchConfig(record.config);
                }
            });
        }

        // Returns weather or not the change was successful
        function changeRecord( uid, state, text, rationale, link ) {
            var ref = service.recordDict[uid];
            if(ref) {
                ref.state = state;
                ref.comments.text = text;
                ref.comments.rationale = rationale;
                ref.comments.link = link;
                ref.dirty = true;
                return true;
            }
            return false;
        }

        // Used for deleting purposes
        function revertRecord(uid) {
            var ref = service.recordDict[uid];
            if(ref) {
                service.recordDict[uid] = new Record(  
                            uid,
                            matchConfig(ref.config),
                            false,
                            ref.config.baseline,
                            ref.config.family,
                            ref.config.priority,
                            ref.config.title,
                            ref.config.enhancements
                    );
                return true;
            }
            return false;
        }

        // Sets the focus record
        function focusID( uid ) {
            var ref = service.recordDict[uid];
            if(ref) {
                service.focusRecord = ref;
                if ( registerFocusCallback.prototype.callbacks ) {
                    angular.forEach( registerFocusCallback.prototype.callbacks,
                            function(callback) { callback(service.focusRecord); } );
                }
                return true;
            } else {
                return false;
            }
        } 

        // Function that creates a call back chain for when an ID is focused (i.e. on selection)
        function registerFocusCallback( callback ) {
            if( !registerFocusCallback.prototype.callbacks ) {
                registerFocusCallback.prototype.callbacks = [];
            }

            registerFocusCallback.prototype.callbacks.push(callback);

        }

        // Returns a list of the records that have been modified
        function dirtySubSet() {
            return $filter('dirtyFilter')(service.recordDict);
        }

        // Returns a list of the records that have been modified
        function parentSubSet() {
            return $filter('parentFilter')(service.recordDict);
        }

    }
})();