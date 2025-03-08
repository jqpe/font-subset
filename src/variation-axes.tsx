import React, { useState, useEffect } from 'react'

type VariationAxis = {
  tag: string
  min_value: number
  max_value: number
  def_value: number
}

interface VariationAxesControlsProps {
  axes: VariationAxis[] | undefined
  onChange?: (values: Record<string, number>) => void
}

export const VariationAxesControls: React.FC<VariationAxesControlsProps> = ({
  axes,
  onChange
}) => {
  const [values, setValues] = useState<Record<string, number>>({})

  useEffect(() => {
    if (axes) {
      // Initialize with default values
      const defaultValues = axes.reduce(
        (acc, axis) => {
          acc[axis.tag] = axis.def_value
          return acc
        },
        {} as Record<string, number>
      )

      setValues(defaultValues)
      onChange?.(defaultValues)
    }
  }, [axes, onChange])

  if (!axes || axes.length === 0) {
    return null
  }

  const handleChange = (tag: string, value: number) => {
    const newValues = { ...values, [tag]: value }
    setValues(newValues)
    onChange?.(newValues)
  }

  return (
    <section className="card">
      <h3 className="mb-2">Font Variation Axes</h3>

      {axes.map(axis => (
        <div key={axis.tag} className="axis-input">
          <label htmlFor={`axis-${axis.tag}`}>{axis.tag}</label>

          <span>{axis.min_value?.toFixed(1)}</span>

          <input
            id={`axis-${axis.tag}`}
            type="range"
            min={axis.min_value}
            max={axis.max_value}
            step={getStep((axis.max_value - axis.min_value) / 100)}
            value={values[axis.tag] ?? axis.def_value}
            onChange={e => handleChange(axis.tag, parseFloat(e.target.value))}
            className="w-full track:min-h-2"
          />

          <span>{axis.max_value.toFixed(1)}</span>
          <span className="ml-2">{values[axis.tag]?.toFixed(1)}</span>
        </div>
      ))}
    </section>
  )
}

const getStep = (calculatedStep: number): number => {
  const possibleSteps = [0.1, 1, 10]

  // Find which step value is closest to the calculated step
  return possibleSteps.reduce((closest, step) => {
    return Math.abs(step - calculatedStep) < Math.abs(closest - calculatedStep)
      ? step
      : closest
  }, possibleSteps[0])
}
