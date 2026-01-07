import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  transportationAreaPricingApi, 
  transportationAreaPricingUtils 
} from '../api/transportationAreaPricing';
import {
  CreateTransportationAreaPricingRequest,
  UpdateTransportationAreaPricingRequest,
  BulkUpsertTransportationAreaPricingRequest,
  CopyTransportationPricingRequest,
  TransportationAreaPricingFilters
} from '../types';

// Query Keys
export const QUERY_KEYS = {
  TRANSPORTATION_AREA_PRICING: 'transportationAreaPricing',
  TRANSPORTATION_AREA_PRICING_BY_AREA: 'transportationAreaPricingByArea',
  TRANSPORTATION_AREA_PRICING_STATS: 'transportationAreaPricingStats',
} as const;

// Hook for fetching all transportation area pricing
export const useTransportationAreaPricing = (filters?: TransportationAreaPricingFilters) => {
  return useQuery(
    [QUERY_KEYS.TRANSPORTATION_AREA_PRICING, filters],
    () => transportationAreaPricingApi.getAll(filters),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );
};

// Hook for fetching transportation area pricing by area
export const useTransportationAreaPricingByArea = (areaName: string, academicYear?: string) => {
  return useQuery(
    [QUERY_KEYS.TRANSPORTATION_AREA_PRICING_BY_AREA, areaName, academicYear],
    () => transportationAreaPricingApi.getByArea(areaName, academicYear),
    {
      enabled: !!areaName,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    }
  );
};

// Hook for fetching single transportation area pricing
export const useTransportationAreaPricingById = (id: number) => {
  return useQuery(
    [QUERY_KEYS.TRANSPORTATION_AREA_PRICING, id],
    () => transportationAreaPricingApi.getById(id),
    {
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    }
  );
};

// Hook for fetching transportation area pricing statistics
export const useTransportationAreaPricingStats = (academicYear?: string) => {
  return useQuery(
    [QUERY_KEYS.TRANSPORTATION_AREA_PRICING_STATS, academicYear],
    () => transportationAreaPricingApi.getStats(academicYear),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
    }
  );
};

// Hook for creating transportation area pricing
export const useCreateTransportationAreaPricing = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (data: CreateTransportationAreaPricingRequest) => transportationAreaPricingApi.create(data),
    {
      onSuccess: () => {
        // Invalidate and refetch transportation area pricing queries
        queryClient.invalidateQueries([QUERY_KEYS.TRANSPORTATION_AREA_PRICING]);
        queryClient.invalidateQueries([QUERY_KEYS.TRANSPORTATION_AREA_PRICING_BY_AREA]);
        queryClient.invalidateQueries([QUERY_KEYS.TRANSPORTATION_AREA_PRICING_STATS]);
      },
      onError: (error) => {
        console.error('Error creating transportation area pricing:', error);
      },
    }
  );
};

// Hook for updating transportation area pricing
export const useUpdateTransportationAreaPricing = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ id, data }: { id: number; data: UpdateTransportationAreaPricingRequest }) =>
      transportationAreaPricingApi.update(id, data),
    {
      onSuccess: (updatedPricing) => {
        // Update the cache with the new data
        queryClient.setQueryData(
          [QUERY_KEYS.TRANSPORTATION_AREA_PRICING, updatedPricing.id],
          updatedPricing
        );
        
        // Invalidate related queries
        queryClient.invalidateQueries([QUERY_KEYS.TRANSPORTATION_AREA_PRICING]);
        queryClient.invalidateQueries([QUERY_KEYS.TRANSPORTATION_AREA_PRICING_BY_AREA]);
        queryClient.invalidateQueries([QUERY_KEYS.TRANSPORTATION_AREA_PRICING_STATS]);
      },
      onError: (error) => {
        console.error('Error updating transportation area pricing:', error);
      },
    }
  );
};

// Hook for deleting transportation area pricing
export const useDeleteTransportationAreaPricing = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (id: number) => transportationAreaPricingApi.delete(id),
    {
      onSuccess: () => {
        // Invalidate and refetch transportation area pricing queries
        queryClient.invalidateQueries([QUERY_KEYS.TRANSPORTATION_AREA_PRICING]);
        queryClient.invalidateQueries([QUERY_KEYS.TRANSPORTATION_AREA_PRICING_BY_AREA]);
        queryClient.invalidateQueries([QUERY_KEYS.TRANSPORTATION_AREA_PRICING_STATS]);
      },
      onError: (error) => {
        console.error('Error deleting transportation area pricing:', error);
      },
    }
  );
};

// Hook for bulk upsert transportation area pricing
export const useBulkUpsertTransportationAreaPricing = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (data: BulkUpsertTransportationAreaPricingRequest) => transportationAreaPricingApi.bulkUpsert(data),
    {
      onSuccess: () => {
        // Invalidate and refetch all related queries
        queryClient.invalidateQueries([QUERY_KEYS.TRANSPORTATION_AREA_PRICING]);
        queryClient.invalidateQueries([QUERY_KEYS.TRANSPORTATION_AREA_PRICING_BY_AREA]);
        queryClient.invalidateQueries([QUERY_KEYS.TRANSPORTATION_AREA_PRICING_STATS]);
      },
      onError: (error) => {
        console.error('Error bulk upsert transportation area pricing:', error);
      },
    }
  );
};

// Hook for copying pricing to new year
export const useCopyTransportationPricing = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (data: CopyTransportationPricingRequest) => transportationAreaPricingApi.copyPricing(data),
    {
      onSuccess: () => {
        // Invalidate and refetch all related queries
        queryClient.invalidateQueries([QUERY_KEYS.TRANSPORTATION_AREA_PRICING]);
        queryClient.invalidateQueries([QUERY_KEYS.TRANSPORTATION_AREA_PRICING_BY_AREA]);
        queryClient.invalidateQueries([QUERY_KEYS.TRANSPORTATION_AREA_PRICING_STATS]);
      },
      onError: (error) => {
        console.error('Error copying transportation pricing:', error);
      },
    }
  );
};

// Combined hook for transportation area pricing management
export const useTransportationAreaPricingManager = (filters?: TransportationAreaPricingFilters) => {
  const queryClient = useQueryClient();

  // Queries
  const transportationAreaPricingQuery = useTransportationAreaPricing(filters);
  const statsQuery = useTransportationAreaPricingStats(filters?.academicYear);

  // Mutations
  const createMutation = useCreateTransportationAreaPricing();
  const updateMutation = useUpdateTransportationAreaPricing();
  const deleteMutation = useDeleteTransportationAreaPricing();
  const bulkUpsertMutation = useBulkUpsertTransportationAreaPricing();
  const copyPricingMutation = useCopyTransportationPricing();

  // Utility functions
  const utils = {
    // Refresh all data
    refetchAll: () => {
      queryClient.invalidateQueries([QUERY_KEYS.TRANSPORTATION_AREA_PRICING]);
      queryClient.invalidateQueries([QUERY_KEYS.TRANSPORTATION_AREA_PRICING_BY_AREA]);
      queryClient.invalidateQueries([QUERY_KEYS.TRANSPORTATION_AREA_PRICING_STATS]);
    },

    // Get academic years from existing data
    getAcademicYears: () => {
      const data = transportationAreaPricingQuery.data?.transportationAreaPricing || [];
      const years = [...new Set(data.map(item => item.academicYear))];
      return years.sort().reverse(); // Most recent first
    },

    // Get unique area names
    getUniqueAreaNames: () => {
      const data = transportationAreaPricingQuery.data?.transportationAreaPricing || [];
      return transportationAreaPricingUtils.getUniqueAreaNames(data);
    },

    // Get areas with pricing info
    getAreasWithPricing: () => {
      const data = transportationAreaPricingQuery.data?.transportationAreaPricing || [];
      const groupedByArea = transportationAreaPricingUtils.groupByArea(data);
      
      return Object.entries(groupedByArea).map(([areaName, areaPricing]) => {
        const totalAmount = transportationAreaPricingUtils.calculateAreaTotal(areaPricing);
        const activePricing = areaPricing.filter(p => transportationAreaPricingUtils.isPricingActive(p));
        
        return {
          areaName,
          pricingCount: areaPricing.length,
          activePricingCount: activePricing.length,
          totalAmount,
          hasPricing: areaPricing.length > 0,
          hasActivePricing: activePricing.length > 0,
        };
      });
    },

    // Format currency
    formatCurrency: transportationAreaPricingUtils.formatCurrency,

    // Format date
    formatDate: transportationAreaPricingUtils.formatDate,

    // Generate academic years
    generateAcademicYears: transportationAreaPricingUtils.generateAcademicYears,

    // Get current academic year
    getCurrentAcademicYear: transportationAreaPricingUtils.getCurrentAcademicYear,

    // Get pricing status
    getPricingStatus: transportationAreaPricingUtils.getPricingStatus,

    // Get status color
    getStatusColor: transportationAreaPricingUtils.getStatusColor,

    // Validate form data
    validateFormData: transportationAreaPricingUtils.validateFormData,

    // Format date for input
    formatDateForInput: transportationAreaPricingUtils.formatDateForInput,
  };

  return {
    // Data
    transportationAreaPricing: transportationAreaPricingQuery.data?.transportationAreaPricing || [],
    pagination: transportationAreaPricingQuery.data?.pagination,
    stats: statsQuery.data,

    // Loading states
    isLoading: transportationAreaPricingQuery.isLoading || statsQuery.isLoading,
    isLoadingPricing: transportationAreaPricingQuery.isLoading,
    isLoadingStats: statsQuery.isLoading,

    // Error states
    error: transportationAreaPricingQuery.error || statsQuery.error,
    pricingError: transportationAreaPricingQuery.error,
    statsError: statsQuery.error,

    // Mutations
    createPricing: createMutation.mutate,
    updatePricing: updateMutation.mutate,
    deletePricing: deleteMutation.mutate,
    bulkUpsertPricing: bulkUpsertMutation.mutate,
    copyPricing: copyPricingMutation.mutate,

    // Mutation states
    isCreating: createMutation.isLoading,
    isUpdating: updateMutation.isLoading,
    isDeleting: deleteMutation.isLoading,
    isBulkUpserting: bulkUpsertMutation.isLoading,
    isCopying: copyPricingMutation.isLoading,

    // Mutation errors
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
    bulkUpsertError: bulkUpsertMutation.error,
    copyError: copyPricingMutation.error,

    // Utilities
    utils,
  };
};

export default useTransportationAreaPricingManager;
