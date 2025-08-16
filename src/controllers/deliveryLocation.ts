import { Request, Response, NextFunction } from 'express';
import { Location } from '../models/deliveryLocation';
import { sendResponse } from '../utils/sendResponse';
import { AppError } from '../middlewares/errorHandler';
import { LocationInterface } from '../types/index.types';

const formatLocation = (loc: LocationInterface) => ({
  id: loc._id.toString(),
  location: loc.location,
  deliveryFee: loc.deliveryFee,
});

export const createLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { location, deliveryFee } = req.body;
    if (!location || deliveryFee == null) {
      throw new AppError('location and deliveryFee are required', 400);
    }

    const deliveryLocation = new Location({ location, deliveryFee });
    await deliveryLocation.save();

    sendResponse({
      res,
      statusCode: 201,
      status: 'success',
      message: 'Location created',
      data: formatLocation(deliveryLocation),
    });
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError('Failed to create location', 500)
    );
  }
};

// ✏️ Update location
export const updateLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { location, deliveryFee } = req.body;

    const deliveryLocation = await Location.findByIdAndUpdate(
      id,
      { location, deliveryFee },
      { new: true, runValidators: true }
    );

    if (!deliveryLocation) {
      throw new AppError('Location not found', 404);
    }

    sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: 'Location updated',
      data: formatLocation(deliveryLocation),
    });
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError('Failed to update location', 500)
    );
  }
};

// 🗑️ Delete location
export const deleteLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const location = await Location.findByIdAndDelete(id);
    if (!location) {
      throw new AppError('Location not found', 404);
    }

    sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: 'Location deleted',
      data: { id },
    });
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError('Failed to delete location', 500)
    );
  }
};

// 📋 Get all locations
export const getLocations = async (
  _: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const locations = await Location.find();

    sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: 'Locations fetched',
      data: locations.map(formatLocation),
    });
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError('Failed to fetch locations', 500)
    );
  }
};
