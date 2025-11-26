// controllers/rootController.js
const companyModel = require('../models/companyModel');
const userModel = require('../models/userModel');

async function panelRootView(req, res, next) {
  try {
    const [companies, adminUsers] = await Promise.all([
      companyModel.getCompanies(),
      userModel.getAdminsWithCompany()
    ]);

    res.render('root', {
      title: 'Panel Root',
      user: req.user,
      companies,
      adminUsers
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  panelRootView
};