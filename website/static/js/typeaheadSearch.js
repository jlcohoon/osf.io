/**
 * A UI component for searching OSF projects and components with typeahead.
 * Depends on typeahead.js.
 */
;(function (global, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else if (typeof $script === 'function') {
        $script.ready(['typeahead'], function() {
            global.TypeaheadSearch = factory(jQuery);
            $script.done('typeaheadSearch');
        });
    } else {
        global.TypeaheadSearch = factory(jQuery);
    }
}(this, function ($) {
    'use strict';

    var substringMatcher = function(strs) {
        return function findMatches(q, cb) {

            // an array that will be populated with substring matches
            var matches = [];

            // regex used to determine if a string contains the substring `q`

            var substrRegex = new RegExp(q, 'i');
            var count = 0;
            // iterate through the pool of strings and for any string that
            // contains the substring `q`, add it to the `matches` array
            $.each(strs, function(i, str) {
            if (substrRegex.test(str.name)) {
                count += 1;
                // the typeahead jQuery plugin expects suggestions to a
                // JavaScript object, refer to typeahead docs for more info
                matches.push({ value: str });

                //alex's hack to limit number of results
                if(count > 14){
                    return false;
                }
                // above you can return name or a dict of name/node id,
            }
            // add an event to the input box -- listens for keystrokes and if there is a keystroke then it should clearrr
            //
            });

            cb(matches);
        };
    };

    function initSelectedOption(inputProject, clearInputProject,
                                     addLink, namespace, nodeType, componentBool){
        //  once a typeahead option is selected, enable the button and assign the add_link variable for use later
        inputProject.bind('typeahead:selected', function(obj, datum) {
            var linkID = datum.value.node_id;
            var routeID = datum.value.route;
            clearInputProject.show();

            inputProject.css('background-color', '#f5f5f5')
                .attr('disabled', true)
                .css('border', '2px solid LightGreen');

            addLink.prop('linkID' + nodeType, linkID)
                .removeAttr('disabled')
                .prop('routeID'+ nodeType, routeID);
            if (componentBool){
                var parentNode = $('#addLink' + namespace).prop('linkID' + nodeType);
                var url = '/api/v1/project/'+ parentNode +'/get_children/';
                var request = $.getJSON(url, function (projects) {
                    var myProjects = projects.nodes.map(
                        function(item){return {
                            'name': item.title,
                            'node_id': item.id,
                            'route': item.api_url,
                        };
                    });

                    if(myProjects.length > 0){
                        $('#inputComponent' + namespace).data('ttTypeahead').dropdown.datasets[0].source = substringMatcher(myProjects);
                        $('#inputComponent' + namespace).attr('disabled', false);
                        $('#inputComponent' + namespace).focus();
                        $('#inputComponent' + namespace).attr('placeholder', 'Type to search');
                    } else{
                        $('#inputComponent' + namespace).attr('disabled', true);
                        $('#inputComponent' + namespace).attr('placeholder', 'Selected project has no components');
                    }
                });
                request.fail(function(xhr, textStatus, error) {
                    Raven.captureMessage('Could not fetch child nodes of ' + parentNode, {
                        url: url, textStatus: textStatus, error: error
                    });
                });

            }
        });
    }

    // add listeners to clear inputs
    function typeaheadAddListener(clearInputProject, inputProject,
                                   addLink, namespace, nodeType, componentBool){
        clearInputProject[0].addEventListener('click', function() {
            clearInputProject.hide();

            inputProject.attr('disabled', false)
                .css('background-color', '')
                .css('border-color','#ccc')
                .val('');

            addLink.removeProp('linkID' + nodeType)
                .removeProp('routeID' + nodeType);

            if(componentBool){
                $('#clearInputComponent' + namespace).click();
                $('#inputComponent' + namespace).attr('disabled', true);
                $('#inputComponent' + namespace).attr('placeholder', 'First select a project');
            }

            if(nodeType === 'Project'){
                addLink.attr('disabled', true);
            }
        });
    }

    function initTypeahead(nodeType, namespace, myProjects){
        $('#input' + nodeType + namespace).typeahead({
            hint: false,
            highlight: true,
            minLength: 0
        },
        {
            name: 'projectSearch' + nodeType + namespace,
            displayKey: function(data){
                return data.value.name;
        },
            source: substringMatcher(myProjects)
        });
    }

    // logic for typeahead searching user's projects
    function initComponentTypeahead(namespace, nodeType, componentBool){
        var myProjects = [];
        var $addLink = $('#addLink' + namespace);
        var $clearInputProject = $('#clearInput' + nodeType + namespace);
        var $inputProject = $('#input'+ nodeType + namespace);

        initSelectedOption($inputProject, $clearInputProject,
                                $addLink, namespace, nodeType, componentBool);
        typeaheadAddListener($clearInputProject, $inputProject,
                              $addLink, namespace, nodeType, componentBool);
        initTypeahead(nodeType, namespace, myProjects);
    }

    // logic for typeahead searching a project's componenets
    function initProjectTypeahead(namespace, nodeType, componentBool){
        var url = '/api/v1/dashboard/get_nodes/';
        var request = $.getJSON(url, function (projects) {

            var myProjects = projects.nodes.map(
                function(item){return {
                    'name': item.title,
                    'node_id': item.id,
                    'route': item.api_url,
                };
            });

            var $addLink = $('#addLink' + namespace);
            var $clearInputProject = $('#clearInput' + nodeType + namespace);
            var $inputProject = $('#input'+ nodeType + namespace);

            initSelectedOption($inputProject, $clearInputProject,
                                    $addLink, namespace, nodeType, componentBool);
            typeaheadAddListener($clearInputProject, $inputProject,
                                  $addLink, namespace, nodeType, componentBool);
            initTypeahead(nodeType, namespace, myProjects);
        });
        request.fail(function(xhr, textStatus, error) {
            Raven.captureMessage('Could not fetch dashboard nodes.', {
                url: url, textStatus: textStatus, error: error
            });
        });
    }

    function TypeaheadSearch(namespace, nodeType, componentBool) {
        if(nodeType.toLowerCase() === 'project'){
            initProjectTypeahead(namespace, nodeType, componentBool);
        } else{
            initComponentTypeahead(namespace, nodeType, componentBool);
        }
    }

    return TypeaheadSearch;
}));
