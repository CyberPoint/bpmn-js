'use strict';


var assign = require('lodash/object/assign'),
    forEach = require('lodash/collection/forEach'),
    is = require('../../util/ModelUtil').is,
    isAny = require('../modeling/util/ModelingUtil').isAny,
    getChildLanes = require('../modeling/util/LaneUtil').getChildLanes,
    isEventSubProcess = require('../../util/DiUtil').isEventSubProcess;


/**
 * A provider for BPMN 2.0 elements context pad
 */
function ContextPadProvider(contextPad, modeling, elementFactory,
                            connect, create, bpmnReplace,
                            canvas) {

  contextPad.registerProvider(this);

  this._contextPad = contextPad;

  this._modeling = modeling;

  this._elementFactory = elementFactory;
  this._connect = connect;
  this._create = create;
  this._bpmnReplace = bpmnReplace;
  this._canvas  = canvas;
}

ContextPadProvider.$inject = [
  'contextPad',
  'modeling',
  'elementFactory',
  'connect',
  'create',
  'bpmnReplace',
  'canvas'
];

module.exports = ContextPadProvider;


ContextPadProvider.prototype.getContextPadEntries = function(element) {

  var contextPad = this._contextPad,
      modeling = this._modeling,

      elementFactory = this._elementFactory,
      connect = this._connect,
      create = this._create,
      bpmnReplace = this._bpmnReplace,
      canvas = this._canvas;

  var actions = {};

  if (element.type === 'label') {
    return actions;
  }

  var businessObject = element.businessObject;

  function startConnect(event, element, autoActivate) {
    connect.start(event, element, autoActivate);
  }

  function removeElement(e) {
    modeling.removeElements([ element ]);
  }

  function getReplaceMenuPosition(element) {

    var Y_OFFSET = 5;

    var diagramContainer = canvas.getContainer(),
        pad = contextPad.getPad(element).html;

    var diagramRect = diagramContainer.getBoundingClientRect(),
        padRect = pad.getBoundingClientRect();

    var top = padRect.top - diagramRect.top;
    var left = padRect.left - diagramRect.left;

    var pos = {
      x: left,
      y: top + padRect.height + Y_OFFSET
    };

    return pos;
  }


  function appendAction(type, className, options, title) {

    function appendListener(event, element) {

      var shape = elementFactory.createShape(assign({ type: type }, options));
      create.start(event, shape, element);
    }

    var shortType = title || type.replace(/^bpmn\:/, '');

    return {
      group: 'model',
      className: className,
      title: 'Append ' + shortType,
      action: {
        dragstart: appendListener,
        click: appendListener
      }
    };
  }

  if (is(businessObject, 'bpmn:FlowNode')) {

    if (!is(businessObject, 'bpmn:EndEvent') &&
        !is(businessObject, 'bpmn:EventBasedGateway') &&
        !isEventType(businessObject, 'bpmn:IntermediateThrowEvent', 'bpmn:LinkEventDefinition') &&
        !isEventSubProcess(businessObject)) {

      assign(actions, {
        'append.end-event': appendAction('bpmn:EndEvent', 'bpmn-icon-end-event-none'),
        'append.gateway': appendAction('bpmn:ParallelGateway', 'bpmn-icon-gateway-parallel'),
        'append.append-task': appendAction('bpmn:Task', 'bpmn-icon-task', undefined, 'Analyzer'),
        'append.append-send-task': appendAction('bpmn:SendTask', 'bpmn-icon-send-task', undefined, 'Action')
      });
    }

    if (is(businessObject, 'bpmn:EventBasedGateway')) {

      assign(actions, {
        'append.receive-task': appendAction('bpmn:ReceiveTask', 'bpmn-icon-receive-task'),
        'append.message-intermediate-event': appendAction('bpmn:IntermediateCatchEvent',
                                                  'bpmn-icon-intermediate-event-catch-message',
                                                  { _eventDefinitionType: 'bpmn:MessageEventDefinition'}),
        'append.timer-intermediate-event': appendAction('bpmn:IntermediateCatchEvent',
                                                  'bpmn-icon-intermediate-event-catch-timer',
                                                  { _eventDefinitionType: 'bpmn:TimerEventDefinition'}),
        'append.condtion-intermediate-event': appendAction('bpmn:IntermediateCatchEvent',
                                                  'bpmn-icon-intermediate-event-catch-condition',
                                                  { _eventDefinitionType: 'bpmn:ConditionalEventDefinition'}),
        'append.signal-intermediate-event': appendAction('bpmn:IntermediateCatchEvent',
                                                  'bpmn-icon-intermediate-event-catch-signal',
                                                  { _eventDefinitionType: 'bpmn:SignalEventDefinition'})
      });
    }
  }

  var replaceOptions = bpmnReplace.getReplaceOptions(element);

  if (replaceOptions.length) {
    // Replace menu entry
    assign(actions, {
      'replace': {
        group: 'edit',
        className: 'bpmn-icon-screw-wrench',
        title: 'Change type',
        action: {
          click: function(event, element) {
            bpmnReplace.openChooser(getReplaceMenuPosition(element), element);
          }
        }
      }
    });
  }

  if (isAny(businessObject, [ 'bpmn:FlowNode', 'bpmn:InteractionNode' ])) {

    assign(actions, {
      'append.text-annotation': appendAction('bpmn:TextAnnotation', 'bpmn-icon-text-annotation'),

      'connect': {
        group: 'connect',
        className: 'bpmn-icon-connection-multi',
        title: 'Connect using Sequence/MessageFlow',
        action: {
          click: startConnect,
          dragstart: startConnect
        }
      }
    });
  }

  if (is(businessObject, 'bpmn:DataObjectReference')) {
    assign(actions, {
      'connect': {
        group: 'connect',
        className: 'bpmn-icon-connection-multi',
        title: 'Connect using DataInputAssociation',
        action: {
          click: startConnect,
          dragstart: startConnect
        }
      }
    });
  }

  // Delete Element Entry
  assign(actions, {
    'delete': {
      group: 'edit',
      className: 'bpmn-icon-trash',
      title: 'Remove',
      action: {
        click: removeElement,
        dragstart: removeElement
      }
    }
  });

  return actions;
};

function isEventType(eventBo, type, definition) {

  var isType = eventBo.$instanceOf(type);
  var isDefinition = false;

  var definitions = eventBo.eventDefinitions || [];
  forEach(definitions, function(def) {
    if (def.$type === definition) {
      isDefinition = true;
    }
  });

  return isType && isDefinition;
}


module.exports = ContextPadProvider;
