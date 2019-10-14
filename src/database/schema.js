import { appSchema, tableSchema } from '@nozbe/watermelondb';

const measureInfoColumn = {name: 'measure_code', type: 'string', isOptional: false, isIndexed: true}
const startedAtColumn = {name: 'started_at', type: 'number', isOptional: false, isIndexed: true}
const endedAtColumn = {name: 'ended_at', type: 'number', isOptional: false, isIndexed: true}
const measuredAtColumn = {name: 'measured_at', type: 'number', isOptional: false, isIndexed: true}

const createdAtColumn = { name: 'created_at', type: 'number' }
const updatedAtColumn = { name: 'updated_at', type: 'number' }


export default appSchema({
    version: 1,
    tables: [
        tableSchema({
            name: 'data_step', 
            columns: [
                {name: 'count', type: 'number', isOptional: false, isIndexed: true},
                startedAtColumn,
                {name: 'bin_unit', type: 'number', isOptional: false},
                measureInfoColumn,
                createdAtColumn,
                updatedAtColumn
            ]
        }),
        tableSchema({
            name: 'data_heartrate', 
            columns: [
                {name: 'bpm', type: 'number', isOptional: false, isIndexed: true},
                measuredAtColumn,
                measureInfoColumn,
                createdAtColumn,
                updatedAtColumn
            ]
        }),
        tableSchema({
            name: 'data_weight', 
            columns: [
                {name: 'weight_kg', type: 'number', isOptional: false, isIndexed: true},
                measuredAtColumn,
                measureInfoColumn,
                createdAtColumn,
                updatedAtColumn
            ]
        }),
        tableSchema({
            name: 'data_workout', 
            columns: [
                {name: 'activity_type', type: 'number', isOptional: false, isIndexed: true},
                startedAtColumn,
                endedAtColumn,
                measureInfoColumn,
                createdAtColumn,
                updatedAtColumn
            ]
        }),
        
        tableSchema({
            name: 'data_sleep', 
            columns: [
                startedAtColumn,
                endedAtColumn,
                measureInfoColumn,
                createdAtColumn,
                updatedAtColumn
            ]
        })
    ]
})