export enum WorkoutCategory{
    IndividualSports = "Individual Sports",
    TeamSports = "Team Sports",
    ExerciseAndFitness = "Exercise and Fitness",
    StudioActivities = "Studio Activities",
    RacketSports = "Racket Sports",
    OutdoorActivities = "OutdoorActivities",
    SnowAndIceSports = "Snow and Ice Sports",
    WaterActivities = "Water Activities",
    MartialArts = "Martial Arts",
    Other = "Other Activities"
}

interface WorkoutActivityType{
    nativeCode: number,
    category: WorkoutCategory,
    name: string
}

const supportedWorkoutActivityTypes = new Map<number, WorkoutActivityType>([
    [2, {nativeCode: 2, category: WorkoutCategory.IndividualSports, name: "Archery"}],
    [7, {nativeCode: 7, category: WorkoutCategory.IndividualSports, name: "Bowling"}],
    [18, {nativeCode: 18, category: WorkoutCategory.IndividualSports, name: "Fencing"}],
    [22, {nativeCode: 22, category: WorkoutCategory.IndividualSports, name: "Gymnastics"}],
    [49, {nativeCode: 49, category: WorkoutCategory.IndividualSports, name: "Track And Field"}],

    [1, {nativeCode: 1, category: WorkoutCategory.TeamSports, name: "American Football"}],
    [3, {nativeCode: 3, category: WorkoutCategory.TeamSports, name: "Australian Football"}],
    [5, {nativeCode: 5, category: WorkoutCategory.TeamSports, name: "Baseball"}],
    [6, {nativeCode: 6, category: WorkoutCategory.TeamSports, name: "Basketball"}],
    [10, {nativeCode: 10, category: WorkoutCategory.TeamSports, name: "Cricket"}],
    [75, {nativeCode: 75, category: WorkoutCategory.TeamSports, name: "Disc Sports"}],
    [23, {nativeCode: 23, category: WorkoutCategory.TeamSports, name: "Handball"}],
    [25, {nativeCode: 25, category: WorkoutCategory.TeamSports, name: "Hockey"}],
    [27, {nativeCode: 27, category: WorkoutCategory.TeamSports, name: "Lacrosse"}],
    [36, {nativeCode: 36, category: WorkoutCategory.TeamSports, name: "Rugby"}],
    [41, {nativeCode: 41, category: WorkoutCategory.TeamSports, name: "Soccer"}],
    [42, {nativeCode: 42, category: WorkoutCategory.TeamSports, name: "Softball"}],
    [51, {nativeCode: 51, category: WorkoutCategory.TeamSports, name: "Volleyball"}],

    [33, {nativeCode: 33, category: WorkoutCategory.ExerciseAndFitness, name: "Preparation And Recovery"}],
    [62, {nativeCode: 62, category: WorkoutCategory.ExerciseAndFitness, name: "Flexibility"}],
    [52, {nativeCode: 52, category: WorkoutCategory.ExerciseAndFitness, name: "Walking"}],
    [37, {nativeCode: 37, category: WorkoutCategory.ExerciseAndFitness, name: "Running"}],
    [70, {nativeCode: 70, category: WorkoutCategory.ExerciseAndFitness, name: "Wheelchair Walk Pace"}],
    [71, {nativeCode: 71, category: WorkoutCategory.ExerciseAndFitness, name: "Wheelchair Run Pace"}],
    [13, {nativeCode: 13, category: WorkoutCategory.ExerciseAndFitness, name: "Cycling"}],
    [74, {nativeCode: 74, category: WorkoutCategory.ExerciseAndFitness, name: "Hand Cycling"}],
    [59, {nativeCode: 59, category: WorkoutCategory.ExerciseAndFitness, name: "Core Training"}],
    [16, {nativeCode: 16, category: WorkoutCategory.ExerciseAndFitness, name: "Elliptical"}],
    [20, {nativeCode: 20, category: WorkoutCategory.ExerciseAndFitness, name: "Functional Strength Training"}],
    [50, {nativeCode: 50, category: WorkoutCategory.ExerciseAndFitness, name: "Traditional Strength Training"}],
    [11, {nativeCode: 11, category: WorkoutCategory.ExerciseAndFitness, name: "Cross Training"}],
    [73, {nativeCode: 73, category: WorkoutCategory.ExerciseAndFitness, name: "Mixed Cardio"}],
    [63, {nativeCode: 63, category: WorkoutCategory.ExerciseAndFitness, name: "High Intensity Interval Training"}],
    [64, {nativeCode: 64, category: WorkoutCategory.ExerciseAndFitness, name: "Jump Rope"}],
    [44, {nativeCode: 44, category: WorkoutCategory.ExerciseAndFitness, name: "Stair Climbing"}],
    [68, {nativeCode: 68, category: WorkoutCategory.ExerciseAndFitness, name: "Stairs"}],
    [69, {nativeCode: 69, category: WorkoutCategory.ExerciseAndFitness, name: "Step Training"}],
    [76, {nativeCode: 76, category: WorkoutCategory.ExerciseAndFitness, name: "Fitness Gaming"}],
    
    [58, {nativeCode: 58, category: WorkoutCategory.StudioActivities, name: "Barre"}],
    [14, {nativeCode: 14, category: WorkoutCategory.StudioActivities, name: "Dance"}],
    [57, {nativeCode: 57, category: WorkoutCategory.StudioActivities, name: "Yoga"}],
    [29, {nativeCode: 29, category: WorkoutCategory.StudioActivities, name: "Mind And Body"}],
    [66, {nativeCode: 66, category: WorkoutCategory.StudioActivities, name: "Pilates"}],

    [4, {nativeCode: 4, category: WorkoutCategory.RacketSports, name: "Badminton"}],
    [34, {nativeCode: 34, category: WorkoutCategory.RacketSports, name: "Racquetball"}],
    [43, {nativeCode: 43, category: WorkoutCategory.RacketSports, name: "Squash"}],
    [47, {nativeCode: 47, category: WorkoutCategory.RacketSports, name: "Table Tennis"}],
    [48, {nativeCode: 48, category: WorkoutCategory.RacketSports, name: "Tennis"}],

    [9, {nativeCode: 9, category: WorkoutCategory.OutdoorActivities, name: "Climbing"}],
    [17, {nativeCode: 17, category: WorkoutCategory.OutdoorActivities, name: "Equestrian Sports"}],
    [19, {nativeCode: 19, category: WorkoutCategory.OutdoorActivities, name: "Fishing"}],
    [21, {nativeCode: 21, category: WorkoutCategory.OutdoorActivities, name: "Golf"}],
    [24, {nativeCode: 24, category: WorkoutCategory.OutdoorActivities, name: "Hiking"}],
    [26, {nativeCode: 26, category: WorkoutCategory.OutdoorActivities, name: "Hunting"}],
    [32, {nativeCode: 32, category: WorkoutCategory.OutdoorActivities, name: "Play"}],

    [60, {nativeCode: 60, category: WorkoutCategory.SnowAndIceSports, name: "Cross Country Skiing"}],
    [12, {nativeCode: 12, category: WorkoutCategory.SnowAndIceSports, name: "Curling"}],
    [61, {nativeCode: 61, category: WorkoutCategory.SnowAndIceSports, name: "Downhill Skiing"}],
    [40, {nativeCode: 40, category: WorkoutCategory.SnowAndIceSports, name: "Snow Sports"}],
    [67, {nativeCode: 67, category: WorkoutCategory.SnowAndIceSports, name: "Snowboarding"}],
    [39, {nativeCode: 39, category: WorkoutCategory.SnowAndIceSports, name: "Skating Sports"}],

    [31, {nativeCode: 31, category: WorkoutCategory.WaterActivities, name: "Paddle Sports"}],
    [35, {nativeCode: 35, category: WorkoutCategory.WaterActivities, name: "Rowing"}],
    [38, {nativeCode: 38, category: WorkoutCategory.WaterActivities, name: "Sailing"}],
    [45, {nativeCode: 45, category: WorkoutCategory.WaterActivities, name: "Surfing Sports"}],
    [46, {nativeCode: 46, category: WorkoutCategory.WaterActivities, name: "Swimming"}],
    [53, {nativeCode: 53, category: WorkoutCategory.WaterActivities, name: "WaterFitness"}],
    [54, {nativeCode: 54, category: WorkoutCategory.WaterActivities, name: "Water Polo"}],
    [55, {nativeCode: 55, category: WorkoutCategory.WaterActivities, name: "Water Sports"}],
    
    [8, {nativeCode: 8, category: WorkoutCategory.MartialArts, name: "Boxing"}],
    [65, {nativeCode: 65, category: WorkoutCategory.MartialArts, name: "Kickboxing"}],
    [28, {nativeCode: 28, category: WorkoutCategory.MartialArts, name: "Martial Arts"}],
    [72, {nativeCode: 72, category: WorkoutCategory.MartialArts, name: "Tai Chi"}],
    [56, {nativeCode: 56, category: WorkoutCategory.MartialArts, name: "Wrestling"}],
    
    [3000, {nativeCode: 3000, category: WorkoutCategory.Other, name: "Other"}],
])

export function getHKWorkoutActivityTypeName(code: number): string{
    return supportedWorkoutActivityTypes[code].name
}

export function getHKWorkoutActivityTypeCategory(code: number): WorkoutCategory{
    return supportedWorkoutActivityTypes[code].category
}


export interface HKPointMeasure{
    measuredAt: number,
    value: number
}

export interface HKStepDatum{
    startedAt: number,
    value: number
}

export interface HKWorkoutDatum{
    startedAt: number,
    endedAt: number,
    activityTypeCode: number
}

export interface HKSleepDatum{
    startedAt: number,
    endedAt: number,
    effciency: number,
    mergedAsleeps: Array<{startedAt: number, endedAt: number}>
}

