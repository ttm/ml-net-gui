const relations = {
  users: {
    children: [
      {field: 'fotos', service: 'foto', isArray: true},
      {field: 'todos', service: 'todo', isArray: true, object: {todo: '_id', type: 'gest'}}
    ]
  },
  todo: {
    children: [
      {field: 'fotos', service: 'foto', isArray: true}
    ],
    parents: [
      {field: 'users', service: 'users', object: {user: '_id', type: 'gest'}}
    ]
  },
  foto: {
    parents: [
      {field: 'user', service: 'users'},
      {field: 'item', service: 'this.ref'}
    ]
  },
  coment: {
    children: [
      {field: 'foto', service: 'foto'}
    ]
  }
}
const getParents = (service) => {
  let rel = relations[service] || {};
  if (!rel.parents) {
    return []
  } else {
    let parents = rel.parents.map((p) => {
      let parent = null;
      let temp = null;
      let isArray = null;
      if (p.service.split('.').length > 1) {
        parent = {};
        isArray = {};
        for (i in relations) {
          temp = relations[i] && relations[i].children ? relations[i].children.filter(c => c.service === service)[0] : [];
          if (temp.length !== 0) parent[i] = temp.field; isArray[i] = temp.isArray;
        }
      } else {
        temp = relations[p.service] && relations[p.service].children ? relations[p.service].children.filter(c => c.service === service)[0] : [];
        parent = temp.field;
        isArray = temp.isArray;
      }
      return { 
        childField: p.field,
        parentField: parent,
        service: p.service,
        parentObject: temp.object,
        object: p.object,
        isArray
      }
    })
    return parents;
  }
}
const getChildren = (service) => {
  return relations[service] && relations[service].children ? relations[service].children : [];
}
const haveChildren = service => context => relations[service] && relations[service].children && relations[service].children.length > 0;
const haveParents = service => context => relations[service] && relations[service].parents && relations[service].parents.length > 0;
module.exports = { relations, getChildren, getParents, haveChildren, haveParents }