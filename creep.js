var mod = {
    extend: function(){     
        Creep.Action = require('./creep.Action'),
        Creep.Setup = require('./creep.Setup'),
        Creep.action = {
            building: require(Paths.action.building), 
            charging: require(Paths.action.charging),
            claiming: require(Paths.action.claiming),
            reserving: require(Paths.action.reserving),
            defending: require(Paths.action.defending),
            dismantling: require(Paths.action.dismantling),
            feeding: require(Paths.action.feeding), 
            fortifying: require(Paths.action.fortifying), 
            fueling: require(Paths.action.fueling), 
            guarding: require(Paths.action.guarding), 
            harvesting: require(Paths.action.harvesting),
            healing: require(Paths.action.healing),
            idle: require(Paths.action.idle),
            invading: require(Paths.action.invading),
            picking: require(Paths.action.picking), 
            repairing: require(Paths.action.repairing), 
            travelling: require(Paths.action.travelling), 
            storing: require(Paths.action.storing), 
            uncharging: require(Paths.action.uncharging),
            upgrading: require(Paths.action.upgrading), 
            withdrawing: require(Paths.action.withdrawing),
            robbing:require(Paths.action.robbing),
            reallocating:require(Paths.action.reallocating)
        };
        Creep.behaviour = {
            claimer: require(Paths.behaviour.claimer),
            hauler: require(Paths.behaviour.hauler),
            healer: require(Paths.behaviour.healer),
            melee: require(Paths.behaviour.melee),
            miner: require(Paths.behaviour.miner),
            mineralMiner: require(Paths.behaviour.mineralMiner),
            pioneer: require(Paths.behaviour.pioneer),
            privateer: require(Paths.behaviour.privateer),
            ranger: require(Paths.behaviour.ranger),
            upgrader: require(Paths.behaviour.upgrader),
            worker: require(Paths.behaviour.worker)
        };
        Creep.setup = {
            claimer: require(Paths.setup.claimer),
            hauler: require(Paths.setup.hauler),
            healer: require(Paths.setup.healer), 
            melee: require(Paths.setup.melee),
            miner: require(Paths.setup.miner),
            mineralMiner: require(Paths.setup.mineralMiner),
            pioneer: require(Paths.setup.pioneer),
            privateer: require(Paths.setup.privateer),
            ranger: require(Paths.setup.ranger),
            upgrader: require(Paths.setup.upgrader),
            worker: require(Paths.setup.worker)
        };
        Creep.loop = function(){
            var run = creep => creep.run();
            _.forEach(Game.creeps, run);
        };

        Creep.partThreat = {
            'move': { common: 0, boosted: 0 },
            'work': { common: 1, boosted: 3 },
            'carry': { common: 0, boosted: 0 },
            'attack': { common: 2, boosted: 5 },
            'ranged_attack': { common: 2, boosted: 5 },
            'heal': { common: 2, boosted: 5 },
            'claim': { common: 1, boosted: 3 },
            'tough': { common: 1, boosted: 3 },
            tower: 20
        }
        Creep.bodyThreat = function(body) {
            let threat = 0;
            let evaluatePart = part => {
                threat += Creep.partThreat[part.type ? part.type : part][part.boost ? 'boosted' : 'common'];
            };
            body.forEach(evaluatePart);
            return threat;
        }

        Creep.prototype.hasActiveOffensivePart = function(){
            return (this.body.find((part) => ( [ATTACK, RANGED_ATTACK].includes(part.type) && part.hits > 0 )) != null);
        }
        Creep.prototype.hasActiveAttackPart = function(){
            return (this.body.find((part) => ( ATTACK == part.type && part.hits > 0 )) != null);
        }
        Creep.prototype.hasActiveRangedAttackPart = function(){
            return (this.body.find((part) => ( RANGED_ATTACK == part.type && part.hits > 0 )) != null);
        }

        Creep.prototype.run = function(behaviour){
            if( !this.spawning ){
                if(!behaviour && this.data && this.data.creepType) {
                    behaviour = Creep.behaviour[this.data.creepType];
                }
                if( behaviour ) behaviour.run(this);
                else if(!this.data){
                    let type = this.memory.setup;
                    let weight = this.memory.cost;
                    let home = this.memory.home;
                    let spawn = this.memory.mother;
                    let breeding = this.memory.breeding;
                    if( type && weight && home && spawn && breeding  ) {
                        //console.log( 'Fixing corrupt creep without population entry: ' + this.name );
                        var entry = Population.setCreep({
                            creepName: this.name, 
                            creepType: type, 
                            weight: weight, 
                            roomName: this.pos.roomName, 
                            homeRoom: home, 
                            motherSpawn: spawn, 
                            actionName: this.action ? this.action.name : null, 
                            targetId: this.target ? this.target.id || this.target.name : null,
                            spawningTime: breeding, 
                            flagName: null, 
                            body: _.countBy(this.body, 'type')
                        });
                        Population.countCreep(this.room, entry);
                    } else {
                        console.log( dye(CRAYON.error, 'Corrupt creep without population entry!! : ' + this.name ));
                        // trying to import creep
                        let counts = _.countBy(this.body, 'type');
                        if( counts[WORK] && counts[CARRY])
                        {
                            let weight = (counts[WORK]*PART_COSTS[WORK]) + (counts[CARRY]*PART_COSTS[CARRY]) + (counts[MOVE]*PART_COSTS[MOVE]); 
                            var entry = Population.setCreep({
                                creepName: this.name, 
                                creepType: 'worker', 
                                weight: weight, 
                                roomName: this.pos.roomName, 
                                homeRoom: this.pos.roomName, 
                                motherSpawn: null, 
                                actionName: null, 
                                targetId: null,
                                spawningTime: -1, 
                                flagName: null, 
                                body: _.countBy(this.body, 'type')
                            });
                            Population.countCreep(this.room, entry);
                        } else this.suicide();
                    }
                }
                if( this.flee ) {
                    this.fleeMove();
                    if( SAY_ASSIGNMENT ) this.say(String.fromCharCode(10133), SAY_PUBLIC); 
                }
            }
        };
        Creep.prototype.leaveBorder = function() {
            // if on border move away 
            // for emergency case, Path not found
            if( this.pos.y == 0 ){
                this.move(BOTTOM);
            } else if( this.pos.x == 0  ){
                this.move(RIGHT);
            } else if( this.pos.y == 49  ){
                this.move(TOP);
            } else if( this.pos.x == 49  ){
                this.move(LEFT);
            }
            // TODO: CORNER cases
        };
        Creep.prototype.honk = function(){
            if( HONK ) this.say('\u{26D4}\u{FE0E}', SAY_PUBLIC);            
        },
        Creep.prototype.honkEvade = function(){
            if( HONK ) this.say('\u{1F500}\u{FE0E}', SAY_PUBLIC);
        },
        Creep.prototype.drive = function( targetPos, intentionRange, enoughRange, range ) {
            if( !targetPos || this.fatigue > 0 || range <= intentionRange ) return;
            if( !range ) range = this.pos.getRangeTo(targetPos);
            let lastPos = this.data.lastPos;
            this.data.lastPos = new RoomPosition(this.pos.x, this.pos.y, this.pos.roomName);
            if( this.data.moveMode == null || 
                (lastPos && // moved
                (lastPos.x != this.pos.x || lastPos.y != this.pos.y || lastPos.roomName != this.pos.roomName)) 
            ) {
                // at this point its sure, that the this DID move in the last loop. 
                // from lastPos to this.pos 
                this.room.recordMove(this);

                if( this.data.moveMode == null) 
                    this.data.moveMode = 'auto';
                if( this.data.path && this.data.path.length > 1 )
                    this.data.path = this.data.path.substr(1);
                else 
                    this.data.path = this.getPath( targetPos, true);

                if( this.data.path && this.data.path.length > 0 ) {
                    let moveResult = this.move(this.data.path.charAt(0));
                    if( moveResult == OK ) { // OK is no guarantee that it will move to the next pos. 
                        this.data.moveMode = 'auto'; 
                    } else logErrorCode(this, moveResult);
                    if( moveResult == ERR_NOT_FOUND ) delete this.data.path;  
                } else if( range > enoughRange ) {
                    this.say('NO PATH!');
                    this.data.targetId = null;
                    this.leaveBorder();
                }
            } else if( this.data.moveMode == 'auto' ) {
                // try again to use path.
                if( range > enoughRange ) {
                    this.honk();
                    this.data.moveMode = 'evade';
                }
                if( !this.data.path || this.data.path.length == 0 )
                    this.data.path = this.getPath( targetPos, true);

                if( this.data.path && this.data.path.length > 0 ) {
                    let moveResult = this.move(this.data.path.charAt(0));
                    if( moveResult != OK ) logErrorCode(this, moveResult);
                    if( moveResult == ERR_NOT_FOUND ) delete this.data.path;  
                } else if( range > enoughRange ) {
                    this.say('NO PATH!');
                    this.data.targetId = null;
                    this.leaveBorder();
                }
            } else { // evade
                // get path (don't ignore thiss)
                // try to move. 
                if( range > enoughRange ){
                    this.honkEvade();
                    delete this.data.path;
                    this.data.path = this.getPath( targetPos, false);
                }                
                if( this.data.path && this.data.path.length > 0 ) {
                    if( this.data.path.length > 5 ) 
                        this.data.path = this.data.path.substr(0,4);
                    let moveResult = this.move(this.data.path.charAt(0));
                    if( moveResult != OK ) logErrorCode(this, moveResult);
                } else if( range > enoughRange ){
                    this.say('NO PATH!');
                    this.data.targetId = null;
                    this.leaveBorder();
                }
            }
        };
        Creep.prototype.getPath = function( targetPos, ignoreCreeps ) {
            let tempTarget = targetPos;
            if (ROUTE_PRECALCULATION && this.pos.roomName != targetPos.roomName) {
                var route = this.room.findRoute(targetPos.roomName);
                if ( route.length > 0 )
                    targetPos = new RoomPosition(25,25,route[0].room);
            }

            let path = this.room.findPath(this.pos, targetPos, {
                serialize: true, 
                ignoreCreeps: ignoreCreeps
            });
            if( path && path.length > 4 ) 
                return path.substr(4);
            else return null;
        };
        Creep.prototype.fleeMove = function( ) {
            if( this.fatigue > 0 ) return;
            let path;
            if( !this.data.fleePath || this.data.fleePath.length < 2 || this.data.fleePath[0].x != this.pos.x || this.data.fleePath[0].y != this.pos.y || this.data.fleePath[0].roomName != this.pos.roomName ) {
                let goals = _.map(this.room.hostiles, function(o) {  
                    return { pos: o.pos, range: 5 };
                });
                
                let ret = PathFinder.search(
                    this.pos, goals, {
                        flee: true,
                        plainCost: 2,
                        swampCost: 10, 
                        maxOps: 500, 
                        maxRooms: 2, 
                        
                        roomCallback: function(roomName) {
                            let room = Game.rooms[roomName];
                            if (!room) return;
                            return room.currentCostMatrix;
                        }
                    }
                );
                path = ret.path

                this.data.fleePath = path;
            } else {
                this.data.fleePath.shift();
                path = this.data.fleePath;
            }
            if( path && path.length > 0 )
                this.move(this.pos.getDirectionTo(new RoomPosition(path[0].x,path[0].y,path[0].roomName)));
        };
        Creep.prototype.idleMove = function( ) {
            if( this.fatigue > 0 ) return;
            // check if on road/structure
            let here = this.room.lookForAt(LOOK_STRUCTURES, this.pos);
            if( here && here.length > 0 ) {
                let path;
                if( !this.data.idlePath || this.data.idlePath.length < 2 || this.data.idlePath[0].x != this.pos.x || this.data.idlePath[0].y != this.pos.y || this.data.idlePath[0].roomName != this.pos.roomName ) {
                    let goals = _.map(this.room.structures.all, function(o) {  
                        return { pos: o.pos, range: 1 };
                    });
                    
                    let ret = PathFinder.search(
                        this.pos, goals, {
                            flee: true,
                            plainCost: 2,
                            swampCost: 10, 
                            maxOps: 350, 
                            maxRooms: 1, 
                            
                            roomCallback: function(roomName) {
                                let room = Game.rooms[roomName];
                                if (!room) return;
                                return room.currentCostMatrix;
                            }
                        }
                    );
                    path = ret.path;
                    this.data.idlePath = path;
                } else {
                    this.data.idlePath.shift();
                    path = this.data.idlePath;
                }
                if( path && path.length > 0 )
                    this.move(this.pos.getDirectionTo(new RoomPosition(path[0].x,path[0].y,path[0].roomName)));
            }
        };
        
        Object.defineProperties(Creep.prototype, {
            'flee': {
                configurable: true,
                get: function() {
                    if( this.data.flee ){
                        // release when restored
                        this.data.flee = this.hits != this.hitsMax;                       
                    } else {
                        // set when low
                        this.data.flee = (this.hits/this.hitsMax) < 0.35; 
                    }
                    return this.data.flee;
                }, 
                set: function(newValue) {
                    this.data.flee = newValue;
                }
            }, 
            'sum': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._sum) || this._sumSet != Game.time ) {
                        this._sumSet = Game.time;
                        this._sum = _.sum(this.carry);
                    }
                    return this._sum;
                }
            }
        });    
    }
}

module.exports = mod;
