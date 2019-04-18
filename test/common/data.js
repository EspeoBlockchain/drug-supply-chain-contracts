const { Vendor, Carrier, Pharmacy } = require('./participantCategories');
const carrierCategories = require('./carrierCategories');

const randomTemperature = () => Math.floor(-20 * Math.random());

const participant = (id, category) => ({
  id,
  category,
});

const conditions = (category = carrierCategories.Truck) => ({
  temperature: randomTemperature(),
  category,
});

module.exports = {
  vendor: id => Object.assign({}, participant(id, Vendor)),
  carrier: (id, carrierCategory) => Object.assign(
    {}, participant(id, Carrier), { conditions: conditions(carrierCategory) },
  ),
  pharmacy: id => Object.assign({}, participant(id, Pharmacy)),
};
