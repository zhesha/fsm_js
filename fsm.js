(function(exports) {
  function State(itentifier, transitions, options) {
    if (options == null || options == undefined) {
      options = {};
    }
    var transitionsList = [];

    if (transitions) {
      transitionsList = transitions.map(function(transition) {
        if (!transition.getCandidate || !transition.testEntity) {
          return Transition({ to: transition });
        }
        return transition;
      });
    }

    return {
      isInitial: options && options.initial && false,
      identify(candidat) {
        if (typeof itentifier == "function") {
          return itentifier(candidat);
        } else {
          return itentifier == candidat;
        }
      },
      transitionsList
    };
  }

  function Transition(options) {
    validateTransitionOptions(options);
    return {
      name: options.name,
      onTransition: options.onTransition,
      getCandidate: function() {
        if (options.generateEntity) {
          return options.generateEntity();
        }
        return options.to;
      },
      testEntity: function(entity) {
        if (options.canTransite) {
          return options.canTransite(entity);
        }
        return options.to == entity;
      }
    };
  }

  function Machine(statesList, options) {
    validateStateList(statesList);
    if (options == null || options == undefined) {
      options = {};
    }

    var currentIndex, history, result;
    start();

    function start() {
      currentIndex = statesList.find(state => state.isInitial) || 0;
      history = [];
      result = options && options.initResult;
    }

    function findStateIndexForCandidat(candidat) {
      var state = statesList.find(state => state.identify(candidat));
      return statesList.indexOf(state);
    }

    function commitTransition(entity, newIndex) {
      if (options && options.calculateResult) {
        result = options.calculateResult(result, entity);
      }
      if (options && options.onTransition) {
        options.onTransition(lastEntity(), entity);
      }
      history.push(entity);
      currentIndex = newIndex;
    }

    function findTransitionForEntity(entity) {
      var state = statesList[currentIndex];
      return state.transitionsList.find(transition =>
        transition.testEntity(entity)
      );
    }

    function findTransitionByName(name) {
      var state = statesList[currentIndex];
      return state.transitionsList.find(transition => transition.name == name);
    }

    function handleTransition(entity, name) {
      var details = getTransitionDetails(entity, name);
      if (!details) {
        options.onUnsupportedTransition &&
          options.onUnsupportedTransition(lastEntity(), entity);
        return false;
      }
      if (details.transition.onTransition) {
        details.transition.onTransition(entity);
      } else if (options.onUnhandledTransition) {
        options.onUnhandledTransition(lastEntity(), entity);
      }
      commitTransition(entity || details.candidat, details.newIndex);
      return true;
    }

    function getTransitionDetails(entity, name) {
      var transition;
      if (name) {
        transition = findTransitionByName(name);
      } else {
        transition = findTransitionForEntity(entity);
      }
      if (!transition) {
        return null;
      }
      var candidat = transition.getCandidate();
      if (!candidat) {
        return null;
      }
      var newIndex = findStateIndexForCandidat(candidat);
      if (newIndex == -1) {
        return null;
      }
      return {
        transition: transition,
        candidat: candidat,
        newIndex: newIndex
      };
    }

    function lastEntity() {
      var previousEntity = history[history.length - 1];
      return previousEntity == undefined ? null : previousEntity;
    }

    return {
      go: function(entity) {
        return handleTransition(entity);
      },
      run: function(name) {
        return handleTransition(null, name);
      },
      isFinished: function() {
        return (
          statesList[currentIndex].transitionsList == null ||
          statesList[currentIndex].transitionsList.length == 0
        );
      },
      history: function() {
        return history;
      },
      result: function() {
        return result;
      },
      last: function() {
        return lastEntity();
      },
      canTransite: function(entity) {
        var details = getTransitionDetails(entity);
        return !!details;
      },
      restart: function () {
        start();
      }
    };
  }

  function validateStateList(statesList) {
    for (var state of statesList) {
      if (!state.identify) {
        throw error(
          "Machine must receive array of States, and each state must have identifier"
        );
      }
    }
  }

  function validateTransitionOptions(options) {
    if (options == null || options == undefined) {
      throw error("Transition must have parameter");
    }
  }

  function error(message) {
    return {
      message: "fsm: " + message,
      toString() {
        return this.message;
      }
    };
  }

  exports.State = State;
  exports.Transition = Transition;
  exports.Machine = Machine;
})(typeof exports === "object" ? exports : this);
