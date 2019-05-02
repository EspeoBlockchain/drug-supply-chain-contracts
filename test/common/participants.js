const { Vendor, Carrier, Pharmacy } = require('./participantCategories');
const carrierCategories = require('./carrierCategories');

const participant = (id, category) => ({
  id,
  category,
});

const conditions = (category = carrierCategories.Truck) => ({
  temperature: -19,
  category,
});

module.exports = {
  vendor: id => Object.assign({}, participant(id, Vendor)),
  carrier: (id, carrierCategory) => ({ ...participant(id, Carrier), conditions: conditions(carrierCategory) }),
  pharmacy: id => Object.assign({}, participant(id, Pharmacy)),
};
