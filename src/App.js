import React, { useMemo, useState } from "react";
import "./styles.css";

export default function App() {
  // Coefficients from your fitted GLM
  const COEF = {
    intercept: -9.775,
    BMI: 0.0933,
    Gender_bin: 0.6164, // male = 1, female = 0
    Age: 0.08994,
    HomeRooms: 0.02038,
    HHIncomeMid: -0.000005803,
    SexOrientation_NotStraight: -0.7994,
    Education_HighSchool: -0.4818,
    Education_College: -0.5578,
    Relationship_InRelationship: 0.1047,
    Race_Hispanic: 0.359,
    Race_Mexican: 0.3573,
    Race_White: -0.2762,
    Race_Other: 0.4876,
    Employment_Employed: -0.1528,
    SleepTrouble_bin: 0.5786, // yes = 1, no = 0
    PhysActive_bin: -0.04761, // yes = 1, no = 0
    SleepHrsNight: 0.0805,
  };

  const [gender, setGender] = useState("female");
  const [age, setAge] = useState(45);
  const [homeRooms, setHomeRooms] = useState(6);
  const [incomeMid, setIncomeMid] = useState(50000);
  const [sexOrientation, setSexOrientation] = useState("Straight");
  const [education, setEducation] = useState("College");
  const [relationshipStatus, setRelationshipStatus] = useState("Single");
  const [race, setRace] = useState("White");
  const [employmentStatus, setEmploymentStatus] = useState("Employed");
  const [sleepTrouble, setSleepTrouble] = useState("No");
  const [physActive, setPhysActive] = useState("Yes");
  const [sleepHrsNight, setSleepHrsNight] = useState(7);

  const [heightUnit, setHeightUnit] = useState("in");
  const [weightUnit, setWeightUnit] = useState("lb");
  const [height, setHeight] = useState(66);
  const [weight, setWeight] = useState(160);
  const [manualBMI, setManualBMI] = useState(25.8);
  const [useCalculatedBMI, setUseCalculatedBMI] = useState(true);

  const bmiFromHeightWeight = useMemo(() => {
    const h = Number(height);
    const w = Number(weight);

    if (!isFinite(h) || !isFinite(w) || h <= 0 || w <= 0) return null;

    const heightMeters = heightUnit === "cm" ? h / 100 : h * 0.0254;
    const weightKg = weightUnit === "kg" ? w : w * 0.45359237;
    const bmi = weightKg / (heightMeters * heightMeters);

    return Number.isFinite(bmi) ? bmi : null;
  }, [height, weight, heightUnit, weightUnit]);

  const bmi = useMemo(() => {
    if (useCalculatedBMI) return bmiFromHeightWeight;
    const m = Number(manualBMI);
    return Number.isFinite(m) && m > 0 ? m : null;
  }, [useCalculatedBMI, bmiFromHeightWeight, manualBMI]);

  const eta = useMemo(() => {
    const ageNum = Number(age);
    const roomsNum = Number(homeRooms);
    const incomeNum = Number(incomeMid);
    const sleepNum = Number(sleepHrsNight);

    if (
      [bmi, ageNum, roomsNum, incomeNum, sleepNum].some(
        (v) => v === null || !Number.isFinite(v)
      )
    ) {
      return null;
    }

    let z = COEF.intercept;
    z += COEF.BMI * bmi;
    z += COEF.Gender_bin * (gender === "male" ? 1 : 0);
    z += COEF.Age * ageNum;
    z += COEF.HomeRooms * roomsNum;
    z += COEF.HHIncomeMid * incomeNum;
    z +=
      COEF.SexOrientation_NotStraight *
      (sexOrientation === "NotStraight" ? 1 : 0);

    if (education === "HighSchool") z += COEF.Education_HighSchool;
    if (education === "College") z += COEF.Education_College;

    if (relationshipStatus === "InRelationship") {
      z += COEF.Relationship_InRelationship;
    }

    if (race === "Hispanic") z += COEF.Race_Hispanic;
    if (race === "Mexican") z += COEF.Race_Mexican;
    if (race === "White") z += COEF.Race_White;
    if (race === "Other") z += COEF.Race_Other;
    // Black is reference

    if (employmentStatus === "Employed") z += COEF.Employment_Employed;

    z += COEF.SleepTrouble_bin * (sleepTrouble === "Yes" ? 1 : 0);
    z += COEF.PhysActive_bin * (physActive === "Yes" ? 1 : 0);
    z += COEF.SleepHrsNight * sleepNum;

    return z;
  }, [
    bmi,
    gender,
    age,
    homeRooms,
    incomeMid,
    sexOrientation,
    education,
    relationshipStatus,
    race,
    employmentStatus,
    sleepTrouble,
    physActive,
    sleepHrsNight,
  ]);

  const probability = useMemo(() => {
    if (eta === null) return null;
    return 1 / (1 + Math.exp(-eta));
  }, [eta]);

  const probabilityPct =
    probability === null ? "--" : `${(probability * 100).toFixed(1)}%`;

  const bmiDisplay = bmi === null ? "--" : bmi.toFixed(2);

  const oddsRatioBMI = Math.exp(COEF.BMI).toFixed(3);
  const oddsRatioAge = Math.exp(COEF.Age).toFixed(3);

  const selectedInputs = [
    ["BMI", bmiDisplay],
    ["Age", String(age)],
    ["Gender", gender === "male" ? "Male" : "Female"],
    ["Home rooms", String(homeRooms)],
    ["Household income midpoint", `$${Number(incomeMid).toLocaleString()}`],
    ["Race1", race],
    ["Sex orientation", sexOrientation],
    ["Education", education],
    ["Relationship status", relationshipStatus],
    ["Employment status", employmentStatus],
    ["Sleep trouble", sleepTrouble],
    ["Physically active", physActive],
    ["Sleep hours per night", String(sleepHrsNight)],
  ];

  const referenceGroups = [
    ["Race1", "Black"],
    ["Education", "8thGrade"],
    ["Relationship status", "Single"],
    ["Employment status", "Unemployed"],
    ["Sex orientation", "Straight"],
    ["Gender", "Female"],
  ];

  const riskLabel =
    probability === null
      ? "Incomplete"
      : probability < 0.1
      ? "Low"
      : probability < 0.25
      ? "Elevated"
      : probability < 0.5
      ? "Moderate"
      : "High";

  const Field = ({ label, children, help }) => (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-sm font-semibold text-slate-800">{label}</div>
      <div className="mt-2">{children}</div>
      {help ? <div className="mt-2 text-xs text-slate-500">{help}</div> : null}
    </div>
  );

  const inputClass =
    "w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500";
  const selectClass = inputClass;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Diabetes Probability Calculator
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            This calculator uses your fitted logistic regression model from the
            NHANES dataset to estimate the probability of diabetes. Continuous
            predictors are entered numerically, while grouped predictors are
            selected from dropdowns.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Age (years)">
                <input
                  className={inputClass}
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </Field>

              <Field label="Gender">
                <select
                  className={selectClass}
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
              </Field>

              <Field
                label="Home rooms"
                help="Numeric input from the NHANES HomeRooms variable."
              >
                <input
                  className={inputClass}
                  type="number"
                  value={homeRooms}
                  onChange={(e) => setHomeRooms(e.target.value)}
                />
              </Field>

              <Field
                label="Household income midpoint ($)"
                help="Numeric HHIncomeMid value used in your model."
              >
                <input
                  className={inputClass}
                  type="number"
                  value={incomeMid}
                  onChange={(e) => setIncomeMid(e.target.value)}
                />
              </Field>

              <Field label="Race1">
                <select
                  className={selectClass}
                  value={race}
                  onChange={(e) => setRace(e.target.value)}
                >
                  <option value="Black">Black</option>
                  <option value="Hispanic">Hispanic</option>
                  <option value="Mexican">Mexican</option>
                  <option value="White">White</option>
                  <option value="Other">Other</option>
                </select>
              </Field>

              <Field label="Sex orientation">
                <select
                  className={selectClass}
                  value={sexOrientation}
                  onChange={(e) => setSexOrientation(e.target.value)}
                >
                  <option value="Straight">Straight</option>
                  <option value="NotStraight">NotStraight</option>
                </select>
              </Field>

              <Field label="Education">
                <select
                  className={selectClass}
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                >
                  <option value="8thGrade">8thGrade</option>
                  <option value="HighSchool">HighSchool</option>
                  <option value="College">College</option>
                </select>
              </Field>

              <Field label="Relationship status">
                <select
                  className={selectClass}
                  value={relationshipStatus}
                  onChange={(e) => setRelationshipStatus(e.target.value)}
                >
                  <option value="Single">Single</option>
                  <option value="InRelationship">InRelationship</option>
                </select>
              </Field>

              <Field label="Employment status">
                <select
                  className={selectClass}
                  value={employmentStatus}
                  onChange={(e) => setEmploymentStatus(e.target.value)}
                >
                  <option value="Unemployed">Unemployed</option>
                  <option value="Employed">Employed</option>
                </select>
              </Field>

              <Field label="Sleep trouble">
                <select
                  className={selectClass}
                  value={sleepTrouble}
                  onChange={(e) => setSleepTrouble(e.target.value)}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </Field>

              <Field label="Physically active">
                <select
                  className={selectClass}
                  value={physActive}
                  onChange={(e) => setPhysActive(e.target.value)}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </Field>

              <Field label="Sleep hours per night">
                <input
                  className={inputClass}
                  type="number"
                  step="0.1"
                  value={sleepHrsNight}
                  onChange={(e) => setSleepHrsNight(e.target.value)}
                />
              </Field>
            </div>

            <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    BMI input
                  </h2>
                  <p className="text-sm text-slate-600">
                    Calculate BMI from height and weight, or type BMI directly.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={useCalculatedBMI}
                    onChange={(e) => setUseCalculatedBMI(e.target.checked)}
                  />
                  Use calculated BMI
                </label>
              </div>

              {useCalculatedBMI ? (
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
                  <Field label="Height">
                    <input
                      className={inputClass}
                      type="number"
                      step="0.1"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                    />
                  </Field>

                  <Field label="Height unit">
                    <select
                      className={selectClass}
                      value={heightUnit}
                      onChange={(e) => setHeightUnit(e.target.value)}
                    >
                      <option value="in">Inches</option>
                      <option value="cm">Centimeters</option>
                    </select>
                  </Field>

                  <Field label="Weight">
                    <input
                      className={inputClass}
                      type="number"
                      step="0.1"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                  </Field>

                  <Field label="Weight unit">
                    <select
                      className={selectClass}
                      value={weightUnit}
                      onChange={(e) => setWeightUnit(e.target.value)}
                    >
                      <option value="lb">Pounds</option>
                      <option value="kg">Kilograms</option>
                    </select>
                  </Field>
                </div>
              ) : (
                <div className="mt-4 max-w-sm">
                  <Field label="Manual BMI">
                    <input
                      className={inputClass}
                      type="number"
                      step="0.1"
                      value={manualBMI}
                      onChange={(e) => setManualBMI(e.target.value)}
                    />
                  </Field>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="sticky top-6 rounded-3xl bg-slate-900 p-6 text-white shadow-xl">
              <div className="text-sm uppercase tracking-[0.2em] text-slate-300">
                Predicted output
              </div>
              <div className="mt-4 text-5xl font-bold">{probabilityPct}</div>
              <div className="mt-2 inline-flex rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-slate-100">
                {riskLabel} probability
              </div>

              <div className="mt-6 space-y-4 border-t border-white/10 pt-6 text-sm text-slate-200">
                <div className="flex items-center justify-between gap-4">
                  <span>Current BMI</span>
                  <span className="font-semibold text-white">{bmiDisplay}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Linear predictor</span>
                  <span className="font-semibold text-white">
                    {eta === null ? "--" : eta.toFixed(3)}
                  </span>
                </div>
                <p className="rounded-2xl bg-white/5 p-4 text-xs leading-5 text-slate-300">
                  This score comes directly from a fitted logistic regression
                  coefficients. It is a model-based estimate from your NHANES
                  training sample, not a medical diagnosis.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                How this was calculated
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                The calculator uses a GLM fitted logistic regression model. Each
                selected category adds its corresponding coefficient relative to
                a reference group, and the final linear predictor is converted
                into a probability with the logistic function.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-800">
                    Selected inputs
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-slate-700">
                    {selectedInputs.map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between gap-4"
                      >
                        <span>{label}</span>
                        <span className="font-medium text-slate-900">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-800">
                    Reference groups in the model
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-slate-700">
                    {referenceGroups.map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between gap-4"
                      >
                        <span>{label}</span>
                        <span className="font-medium text-slate-900">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border bg-slate-50 p-4 text-sm text-slate-700">
                <div className="font-semibold text-slate-800">
                  Quick model interpretation
                </div>
                <p className="mt-2 leading-6">
                  In the fitted model, each 1-unit increase in BMI multiplies
                  the odds of diabetes by{" "}
                  <span className="font-semibold text-slate-900">
                    {oddsRatioBMI}
                  </span>
                  , and each 1-year increase in age multiplies the odds by{" "}
                  <span className="font-semibold text-slate-900">
                    {oddsRatioAge}
                  </span>
                  , holding the other predictors constant.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
