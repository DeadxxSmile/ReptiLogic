import { useState, useEffect, useCallback, useRef } from 'react'

export function useAsync(asyncFn, deps = [], options = {}) {
  const { initialData = null, keepPreviousData = true } = options
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const requestIdRef = useRef(0)

  const run = useCallback(async () => {
    const requestId = ++requestIdRef.current

    setLoading(true)
    setError(null)
    if (!keepPreviousData) {
      setData(initialData)
    }

    try {
      const result = await asyncFn()
      if (requestId === requestIdRef.current) {
        setData(result)
      }
      return result
    } catch (e) {
      if (requestId === requestIdRef.current) {
        setError(e?.message || 'Something went wrong')
      }
      throw e
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [initialData, keepPreviousData, ...deps])

  useEffect(() => {
    run().catch(() => {})

    return () => {
      requestIdRef.current += 1
    }
  }, [run])

  return { data, loading, error, refetch: run }
}

export function useAnimals() {
  return useAsync(() => window.api.animals.getAll(), [])
}

export function useAnimal(id) {
  return useAsync(() => window.api.animals.getById(id), [id])
}

export function useSpecies() {
  return useAsync(() => window.api.species.getAll(), [])
}

export function useMorphs(speciesId) {
  return useAsync(
    () => speciesId ? window.api.morphs.getBySpecies(speciesId) : Promise.resolve([]),
    [speciesId]
  )
}

export function useBreeding() {
  return useAsync(() => window.api.breeding.getAll(), [])
}

export function useBreedingRecord(id) {
  return useAsync(() => window.api.breeding.getById(id), [id])
}
