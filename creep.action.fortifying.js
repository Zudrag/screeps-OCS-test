var action = new Creep.Action('fortifying');
action.maxPerTarget = 1;
action.maxPerAction = 1;
action.targetRange = 3;
action.isValidAction = function(creep){
    return (creep.carry.energy > 0 && ( !creep.room.storage || creep.room.storage.store.energy > MAX_STORAGE_ENERGY ));
};
action.isValidTarget = function(target){
    return ( target != null && target.hits && target.hits < target.hitsMax);
};
action.newTarget = function(creep){
    var that = this;
    var isAddable = target => that.isAddableTarget(target, creep);
    return _.find(creep.room.fortifyableSites, isAddable);
};
action.work = function(creep){
    return creep.repair(creep.target);
};
action.onAssignment = function(creep, target) {
    if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(9874), SAY_PUBLIC); 
};
module.exports = action;
