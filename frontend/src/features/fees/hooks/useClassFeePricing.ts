import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  classFeePricingApi, 
  feeCategoriesApi, 
  classesApi,
  classFeePricingUtils 
} from '../api/classFeePricing';
import {
  CreateClassFeePricingRequest,
  UpdateClassFeePricingRequest,
  BulkUpsertClassFeePricingRequest,
  CopyPricingRequest,
  ClassFeePricingFilters
} from '../types';

// Query Keys
export const QUERY_KEYS = {
  CLASS_FEE_PRICING: 'classFeePricing',
  CLASS_FEE_PRICING_BY_CLASS: 'classFeePricingByClass',
  FEE_CATEGORIES: 'feeCategories',
  CLASSES: 'classes',
} as const;

// Hook for fetching all class fee pricing
export const useClassFeePricing = (filters?: ClassFeePricingFilters) => {
  return useQuery(
    [QUERY_KEYS.CLASS_FEE_PRICING, filters],
    () => classFeePricingApi.getAll(filters),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );
};

// Hook for fetching class fee pricing by class
export const useClassFeePricingByClass = (classId: number, academicYear?: string) => {
  return useQuery(
    [QUERY_KEYS.CLASS_FEE_PRICING_BY_CLASS, classId, academicYear],
    () => classFeePricingApi.getByClass(classId, academicYear),
    {
      enabled: !!classId,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    }
  );
};

// Hook for fetching single class fee pricing
export const useClassFeePricingById = (id: number) => {
  return useQuery(
    [QUERY_KEYS.CLASS_FEE_PRICING, id],
    () => classFeePricingApi.getById(id),
    {
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    }
  );
};

// Hook for fetching fee categories
export const useFeeCategories = (classBased: boolean = false) => {
  return useQuery(
    [QUERY_KEYS.FEE_CATEGORIES, classBased],
    () => classBased ? feeCategoriesApi.getClassBased() : feeCategoriesApi.getAll(),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
    }
  );
};

// Hook for fetching classes
export const useClasses = () => {
  return useQuery(
    [QUERY_KEYS.CLASSES],
    () => classesApi.getAll(),
    {
      staleTime: 10 * 60 * 1000,
      cacheTime: 30 * 60 * 1000,
    }
  );
};

// Hook for creating class fee pricing
export const useCreateClassFeePricing = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (data: CreateClassFeePricingRequest) => classFeePricingApi.create(data),
    {
      onSuccess: () => {
        // Invalidate and refetch class fee pricing queries
        queryClient.invalidateQueries([QUERY_KEYS.CLASS_FEE_PRICING]);
        queryClient.invalidateQueries([QUERY_KEYS.CLASS_FEE_PRICING_BY_CLASS]);
      },
      onError: (error) => {
        console.error('Error creating class fee pricing:', error);
      },
    }
  );
};

// Hook for updating class fee pricing
export const useUpdateClassFeePricing = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ id, data }: { id: number; data: UpdateClassFeePricingRequest }) =>
      classFeePricingApi.update(id, data),
    {
      onSuccess: (updatedPricing) => {
        // Update the cache with the new data
        queryClient.setQueryData(
          [QUERY_KEYS.CLASS_FEE_PRICING, updatedPricing.id],
          updatedPricing
        );
        
        // Invalidate related queries
        queryClient.invalidateQueries([QUERY_KEYS.CLASS_FEE_PRICING]);
        queryClient.invalidateQueries([QUERY_KEYS.CLASS_FEE_PRICING_BY_CLASS]);
      },
      onError: (error) => {
        console.error('Error updating class fee pricing:', error);
      },
    }
  );
};

// Hook for deleting class fee pricing
export const useDeleteClassFeePricing = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (id: number) => classFeePricingApi.delete(id),
    {
      onSuccess: () => {
        // Invalidate and refetch class fee pricing queries
        queryClient.invalidateQueries([QUERY_KEYS.CLASS_FEE_PRICING]);
        queryClient.invalidateQueries([QUERY_KEYS.CLASS_FEE_PRICING_BY_CLASS]);
      },
      onError: (error) => {
        console.error('Error deleting class fee pricing:', error);
      },
    }
  );
};

// Hook for bulk upsert class fee pricing
export const useBulkUpsertClassFeePricing = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (data: BulkUpsertClassFeePricingRequest) => classFeePricingApi.bulkUpsert(data),
    {
      onSuccess: () => {
        // Invalidate and refetch all related queries
        queryClient.invalidateQueries([QUERY_KEYS.CLASS_FEE_PRICING]);
        queryClient.invalidateQueries([QUERY_KEYS.CLASS_FEE_PRICING_BY_CLASS]);
      },
      onError: (error) => {
        console.error('Error bulk upserting class fee pricing:', error);
      },
    }
  );
};

// Hook for copying pricing to new year
export const useCopyPricing = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (data: CopyPricingRequest) => classFeePricingApi.copyPricing(data),
    {
      onSuccess: () => {
        // Invalidate and refetch all related queries
        queryClient.invalidateQueries([QUERY_KEYS.CLASS_FEE_PRICING]);
        queryClient.invalidateQueries([QUERY_KEYS.CLASS_FEE_PRICING_BY_CLASS]);
      },
      onError: (error) => {
        console.error('Error copying pricing:', error);
      },
    }
  );
};

// Combined hook for class fee pricing management
export const useClassFeePricingManager = (filters?: ClassFeePricingFilters) => {
  const queryClient = useQueryClient();

  // Queries
  const classFeePricingQuery = useClassFeePricing(filters);
  const feeCategoriesQuery = useFeeCategories(true); // Only class-based categories
  const classesQuery = useClasses();

  // Mutations
  const createMutation = useCreateClassFeePricing();
  const updateMutation = useUpdateClassFeePricing();
  const deleteMutation = useDeleteClassFeePricing();
  const bulkUpsertMutation = useBulkUpsertClassFeePricing();
  const copyPricingMutation = useCopyPricing();

  // Utility functions
  const utils = {
    // Refresh all data
    refetchAll: () => {
      queryClient.invalidateQueries([QUERY_KEYS.CLASS_FEE_PRICING]);
      queryClient.invalidateQueries([QUERY_KEYS.CLASS_FEE_PRICING_BY_CLASS]);
    },

    // Get academic years from existing data
    getAcademicYears: () => {
      const data = classFeePricingQuery.data || [];
      const years = [...new Set(data.map(item => item.academicYear))];
      return years.sort().reverse(); // Most recent first
    },

    // Get classes with pricing info
    getClassesWithPricing: () => {
      const classes = classesQuery.data || [];
      const pricing = classFeePricingQuery.data || [];
      
      return classes.map(cls => {
        const classPricing = pricing.filter(p => p.classId === cls.id);
        const totalAmount = classFeePricingUtils.calculateClassTotal(classPricing);
        
        return {
          ...cls,
          pricingCount: classPricing.length,
          totalAmount,
          hasPricing: classPricing.length > 0,
        };
      });
    },

    // Format amount
    formatAmount: classFeePricingUtils.formatAmount,

    // Generate academic years
    generateAcademicYears: classFeePricingUtils.generateAcademicYears,

    // Get current academic year
    getCurrentAcademicYear: classFeePricingUtils.getCurrentAcademicYear,
  };

  return {
    // Data
    classFeePricing: classFeePricingQuery.data || [],
    feeCategories: feeCategoriesQuery.data || [],
    classes: classesQuery.data || [],

    // Loading states
    isLoading: classFeePricingQuery.isLoading || feeCategoriesQuery.isLoading || classesQuery.isLoading,
    isLoadingPricing: classFeePricingQuery.isLoading,
    isLoadingCategories: feeCategoriesQuery.isLoading,
    isLoadingClasses: classesQuery.isLoading,

    // Error states
    error: classFeePricingQuery.error || feeCategoriesQuery.error || classesQuery.error,
    pricingError: classFeePricingQuery.error,
    categoriesError: feeCategoriesQuery.error,
    classesError: classesQuery.error,

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

export default useClassFeePricingManager;
