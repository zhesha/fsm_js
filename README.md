# fsm - [Finite-state machine](https://en.wikipedia.org/wiki/Finite-state_machine)

You can create simple FSM:
```
var machine = Machine([
  State('solid', ['liquid'], {initial: true}),
  State('liquid', ['solid', 'gas']),
  State('gas', ['liquid']),
]);

machine.go('liquid');
machine.go('gas');
machine.go('liquid');
```

Or more complicate:
```
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

machine.go('liquid');
machine.run('freeze');
machine.go('liquid');
machine.history() == ['liquid', 'solid', 'liquid'];
machine.result() == 'lsl';
```

## Machine

You can create machine by calling `Machine` function

```
var machine = Machine(statesList, options);
```
where `statesList` must be array of `State`'s. "options" is optional

### Machine options

```
var machine = Machine(statesList, {
  onTransition(from, to) {
    // this function will be called whenever any transition happens
  },
  onUnhandledTransition(from, to) {
    // this function will be called only if corresponding Transition don't have `onTransition` handler
  },
  onUnsupportedTransition(from, to) {
    // this function will be called if `go` or `run` called but no supported transition found
  },
  initResult: '', // init value for result
  calculateResult: function (memo, entity) {
    // this function will be called whenever any transition happens. First argument is old result, and second is entity what must be combined with old result. Function must return combined result.
  }
});
```

### Machine methods

Method `go` run transition to the state what identified by the entity, and return `true` if transition possible or `false` if not
```
machine.go(ace);
```

Method `run` run transition by the name, and return `true` if transition possible or `false` if not
```
m.run('transition');
```

Also:
```
// returns true if there are no transitions from current state, or false in other case
m.isFinished()
// returns last entity what runs transition
m.last()
// check if transition posible
m.canTransite(entity)
// returns all entities from runed transition
m.history()
// returns gathered result
m.result()
```

## State

```
State(identifier, transitionsList, options);
```
where `transitionsList` must be array of `Transition`'s, and it's optional. "options" is optional.
If some `Transition` in `transitionsList` have only `to` field it can be simplified this way:
```
State(identifier, [Transition({to: 'test'})]);
State(identifier, ['test']);
```
Both State are equal.

## State identifier

State identifier can be object or function
If it is object fsm will compere it with candidat object with operator "==", if comparision returns true thats mean the State is fit and it's be next State.

```
var machine = Machine([
  State(null, ['test'], {initial: true}),
  State('test'),
]);
machine.go('test');
```
If more complex logic needed you can use function. It must return true if entity is fit to this State

```
var testEntity = {id: "test"};
var machine = Machine([
  State(null, [testEntity], {initial: true}),
  State(function(entity) {
    return entity.id == "test";
  }),
]);
machine.go(testEntity);
```

### State options

Option can have field "initial" if machine must be initialized with this State. If few States have this option machine will be initialized with first of them. The State what will be initial will not be in a `history` or `result`.
```
State(identifier, transitionsList, { initial: true });
```

## Transition

```
Transition(parameters);
Transition({
  name: 'testing',
  to: 'test',
  canTransite: function (entity) {
  },
  generateEntity: function () {
  },
  onTransition: function (from) {
  }
});
```

## Transitions parameters

*name* parameter used if you call `run` function on machine. It must be string and uniquly identify the transition. If transition runs using `run` function it must have `generateEntity` or `to` parameter, what will be used to identify `State`.

```
var machine = Machine([
  State(null, [
    Transition({
      name: 'testing',
      to: 'test'
    })
  ], {initial: true}),
  State('test'),
], options);
machine.run('testing');
```

*canTransite* parameter used if you call `go` function on machine. It must return `true` if trunsition to given entity is possible. If `canTransite`used parameters can have `generateEntity` or `to` field to identify `State`, if them absent original(what passed to `go` function) entity used.

```
var machine = Machine([
  State(null, [
    Transition({
      canTransite: function (entity) {
        return entity == 'test'
      }
    })
  ], {initial: true}),
  State('test'),
], options);
machine.go('test');
```

*to* parameter is a minimum to create valid `Transition`. If there is no `canTransite` it used to deside if transition possible. If there is no `generateEntity` it used to identify `State`.

```
var machine = Machine([
  State(null, [
    Transition({
      to: 'test'
    })
  ], {initial: true}),
  State('test'),
], options);
machine.go('test');
```

*generateEntity* is used to identify suitable `State`.

```
var machine = Machine([
  State(null, [
    Transition({
      to: 'forward',
      generateEntity: function () {
        return 'test';
      }
    })
  ], {initial: true}),
  State('test'),
], options);
machine.go('forward');
```

*onTransition* calls when transition happens.

```
var machine = Machine([
  State(null, [
    Transition({
      to: 'test',
      onTransition: function (from) {
        console.log('it transite');
      }
    })
  ], {initial: true}),
  State('test'),
], options);
machine.go('test'); // it transite
```
