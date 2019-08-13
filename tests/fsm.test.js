var fsm = require("../fsm");
var State = fsm.State;
var Transition = fsm.Transition;
var Machine = fsm.Machine;

test('water states test', function() {
  var machine = Machine([
    State('solid', ['liquid'], {initial: true}),
    State('liquid', ['solid', 'gas']),
    State('gas', ['liquid']),
  ]);

  expect(machine.go('gas')).toBe(false);
  expect(machine.go('liquid')).toBe(true);
  expect(machine.go('gas')).toBe(true);
  expect(machine.go('gas')).toBe(false);
  expect(machine.go('liquid')).toBe(true);
});

test('water states bigger test', function() {
  var machine = Machine(
    [
      State('solid', [Transition({to: 'liquid'})], {initial: true}),
      State('liquid', [
        Transition({name: 'freeze', to: 'solid'}),
        'gas'
      ]),
      State(entity => entity == 'gas', [
        Transition({
          canTransite: function (entity) {
            return entity == 'liquid';
          },
          generateEntity: function () {
            return 'liquid';
          },
        })
      ]),
    ],
    {
      initResult: '',
      calculateResult: function (memo, entity) {
        return memo + entity[0];
      }
    }
  );

  expect(machine.go('gas')).toBe(false);
  expect(machine.go('liquid')).toBe(true);
  expect(machine.run('freeze')).toBe(true);
  expect(machine.go('liquid')).toBe(true);
  expect(machine.go('gas')).toBe(true);
  expect(machine.go('liquid')).toBe(true);
  expect(machine.result()).toBe('lslgl');
  expect(machine.history()).toEqual(['liquid', 'solid', 'liquid', "gas", "liquid"]);
});

test('key word', function() {
  var machine = Machine([
    State(null, ['v']),
    State('v', ['a']),
    State('a', ['r']),
    State('r'),
  ]);

  var str = 'var';

  for (var i = 0; i < str.length; i++) {
    expect(machine.go(str[i])).toBe(true);
  }
  expect(machine.isFinished()).toBe(true);
});

test('identifier', function() {
  var isLetter = function (entity){
    return entity.match(/[a-zA-Z]/);
  };
  var isSimbol = function (entity){
    return entity.match(/[a-zA-Z0-9]/);
  };
  var machine = Machine([
    State(null, [Transition({to: 'letter', canTransite: isLetter})], {initial: true}),
    State('letter', [Transition({to: 'simbol', canTransite: isSimbol})]),
    State('simbol', [Transition({to: 'simbol', canTransite: isSimbol})])
  ], {
    initResult: '',
    calculateResult: function (memo, next) {
      return memo + next;
    }
  });

  var str = 'var123';

  for (var i = 0; i < str.length; i++) {
    var r=  machine.go(str[i]);
    expect(r).toBe(true);
  }
  expect(machine.history()).toEqual(['v', 'a', 'r', '1', '2', '3']);
  expect(machine.result()).toBe('var123');
});

test("Machine onTransition options", function() {
  var aTo = [], aFrom = [];
  var machine = Machine([
    State(null, ['test1'], {initial: true}),
    State('test1', ['test2']),
    State('test2'),
  ], {
    onTransition(from, to) {
      aFrom.push(from);
      aTo.push(to);
    }
  });
  machine.go('test1');
  machine.go('test2');
  expect(aFrom).toEqual([null, 'test1']);
  expect(aTo).toEqual(['test1', 'test2']);
});

test("Machine onUnhandledTransition options", function() {
  var handled;
  var unhandled;
  var machine = Machine([
    State(null, ['test1'], {initial: true}),
    State('test1', [
      Transition({
        to: 'test2',
        onTransition(to){
          handled = to;
        }
      })
    ]),
    State('test2'),
  ], {
    onUnhandledTransition(from, to) {
      unhandled = to;
    }
  });
  machine.go('test1');
  machine.go('test2');
  expect(handled).toBe('test2');
  expect(unhandled).toBe('test1');
});

test("Machine onUnsupportedTransition options", function() {
  var aFrom, aTo;
  var machine = Machine([
    State(null, ['test'], {initial: true}),
    State('test')
  ], {
    onUnsupportedTransition(from, to) {
      aFrom = from;
      aTo = to;
    }
  });
  machine.go('wrong');
  expect(aFrom).toBe(null);
  expect(aTo).toBe('wrong');
});

test("Machine isFinished method", function() {
  var machine = Machine([
    State(null, ['test'], {initial: true}),
    State('test')
  ]);
  expect(machine.isFinished()).toBe(false);
  machine.go('test');
  expect(machine.isFinished()).toBe(true);
});

test("Machine last method", function() {
  var machine = Machine([
    State(null, ['test'], {initial: true}),
    State('test')
  ]);
  machine.go('test');
  expect(machine.last()).toBe('test');
});

test("Machine canTransite method", function() {
  var machine = Machine([
    State(null, ['test'], {initial: true}),
    State('test')
  ]);
  expect(machine.canTransite('test')).toBe(true);
  expect(machine.canTransite('wrong')).toBe(false);
});

test("Transition to with canTransite", function() {
  var machine = Machine([
    State(null, [
      Transition({
        to: 'test',
        canTransite(e) {
          return 't' == e
        }
      })
    ], {initial: true}),
    State('test')
  ]);
  machine.go('t');
  expect(machine.history()[0]).toBe('t');
});

test("Transition to with generateEntity", function() {
  var machine = Machine([
    State(null, [
      Transition({
        to: 't',
        generateEntity() {
          return 'test'
        }
      })
    ], {initial: true}),
    State('test')
  ]);
  machine.go('t');
  expect(machine.history()[0]).toBe('t');
});

test("error converted to string", function() {
  var errorText = 'prefil 1';
  var errorMessage = 'prefil 2';
  try {
    var transition = Transition();
  } catch (e) {
    errorText = e.toString();
    errorMessage = e.message;
  }
  expect(errorText).toBe(errorMessage);
});

test("Transition trows on wrong options ", function() {
  expect(() => {
    var transition = Transition();
  }).toThrow();
});

test("Machine trows on wrong states list", function() {
  expect(() => {
    var machine = Machine(['test']);
  }).toThrow();
});

test("Won't go if transition wrong", function() {
  var machine = Machine([
    State('solid', ['wrong'], {initial: true}),
    State('liquid')
  ]);

  expect(machine.go('wrong')).toBe(false);
});

test("Won't go if transition wrong", function() {
  var machine = Machine([
    State('solid', [
      Transition({
        canTransite(){
          return true;
        }
      })
    ], {initial: true}),
    State('liquid')
  ]);

  expect(machine.go('wrong')).toBe(false);
});
