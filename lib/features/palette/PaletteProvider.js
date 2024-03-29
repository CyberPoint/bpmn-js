'use strict';

var assign = require('lodash/object/assign');

/**
 * A palette provider for BPMN 2.0 elements.
 */
function PaletteProvider(palette, create, elementFactory, spaceTool, lassoTool) {

  this._create = create;
  this._elementFactory = elementFactory;
  this._spaceTool = spaceTool;
  this._lassoTool = lassoTool;

  palette.registerProvider(this);
}

module.exports = PaletteProvider;

PaletteProvider.$inject = [ 'palette', 'create', 'elementFactory', 'spaceTool', 'lassoTool' ];


PaletteProvider.prototype.getPaletteEntries = function(element) {

  var actions  = {},
      create = this._create,
      elementFactory = this._elementFactory,
      spaceTool = this._spaceTool,
      lassoTool = this._lassoTool;


  function createAction(type, group, className, title, options) {

    function createListener(event) {
      var shape = elementFactory.createShape(assign({ type: type }, options));

      if (options) {
        shape.businessObject.di.isExpanded = options.isExpanded;
      }

      create.start(event, shape);
    }

    var shortType = type.replace(/^bpmn\:/, '');

    return {
      group: group,
      className: className,
      title: title || 'Create ' + shortType,
      action: {
        dragstart: createListener,
        click: createListener
      }
    };
  }

  function createParticipant(event, collapsed) {
    create.start(event, elementFactory.createParticipantShape(collapsed));
  }

  function createLane(event) {
    create.start(event, elementFactory.createShape({ type: 'bpmn:Lane' }));
  }

    assign(actions, {
        'lasso-tool': {
            group: 'tools',
            className: 'bpmn-icon-lasso-tool',
            title: 'Lasso tool',
            action: {
                click: function(event) {
                    lassoTool.activateSelection(event);
                }
            }
        },
        'space-tool': {
            group: 'tools',
            className: 'bpmn-icon-space-tool',
            title: 'Space tool',
            action: {
                click: function(event) {
                    spaceTool.activateSelection(event);
                }
            }
        },
        'tool-separator': {
            group: 'tools',
            separator: true
        },
        'create.start-event': createAction(
            'bpmn:StartEvent', 'event', 'bpmn-icon-start-event-none', 'Start'
        ),
        'create.end-event': createAction(
            'bpmn:EndEvent', 'event', 'bpmn-icon-end-event-none', 'End'
        ),
        'create.parallel-gateway': createAction(
            'bpmn:ParallelGateway', 'gateway', 'bpmn-icon-gateway-parallel', 'Gateway'
        ),
        'create.task': createAction(
            'bpmn:Task', 'activity', 'bpmn-icon-task', 'Analyzer'
        ),
        'create.send-task': createAction(
            'bpmn:SendTask', 'activity', 'bpmn-icon-send-task', 'Action'
        )
    });

  return actions;
};
