const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const voucherService = require('../services/voucherService');

// @route   POST api/vouchers
// @desc    Create a new voucher
// @access  Private (Admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const {
      code,
      name,
      description,
      type,
      value,
      minOrderValue,
      maxDiscount,
      usageLimit,
      startDate,
      endDate,
      applicableProducts,
      applicableCategories
    } = req.body;

    const voucher = await voucherService.createVoucher({
      code,
      name,
      description,
      type,
      value,
      minOrderValue,
      maxDiscount,
      usageLimit,
      startDate,
      endDate,
      applicableProducts,
      applicableCategories
    });

    res.json(voucher);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/vouchers/:code
// @desc    Get voucher by code
// @access  Private
router.get('/:code', auth, async (req, res) => {
  try {
    const voucher = await voucherService.getVoucherByCode(req.params.code);
    res.json(voucher);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/vouchers
// @desc    Get all active vouchers
// @access  Public
router.get('/', async (req, res) => {
  try {
    const filters = {
      type: req.query.type,
      search: req.query.search,
      limit: req.query.limit,
      offset: req.query.offset
    };

    const vouchers = await voucherService.getActiveVouchers(filters);
    res.json(vouchers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/vouchers/:id
// @desc    Update a voucher
// @access  Private (Admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const voucher = await voucherService.updateVoucher(req.params.id, req.body);
    res.json(voucher);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/vouchers/:id
// @desc    Deactivate a voucher
// @access  Private (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const voucher = await voucherService.deactivateVoucher(req.params.id);
    res.json({ msg: 'Voucher deactivated', voucher });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/vouchers/validate
// @desc    Validate voucher for order
// @access  Private
router.post('/validate', auth, async (req, res) => {
  try {
    const { code, orderData } = req.body;

    const result = await voucherService.validateVoucher(code, orderData);
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/vouchers/apply
// @desc    Apply voucher to order
// @access  Private
router.post('/apply', auth, async (req, res) => {
  try {
    const { code, orderData } = req.body;

    const result = await voucherService.applyVoucherToOrder(code, orderData);
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/vouchers/:id/stats
// @desc    Get voucher statistics
// @access  Private (Admin only)
router.get('/:id/stats', adminAuth, async (req, res) => {
  try {
    const stats = await voucherService.getVoucherStats(req.params.id);
    res.json(stats);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;