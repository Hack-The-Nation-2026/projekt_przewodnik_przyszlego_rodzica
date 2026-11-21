import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { BenefitCode } from '@/lib/benefit-interview'
import { isFamilyBenefit } from '@/lib/benefit-document-context'
import type { DateRange } from '@/lib/benefit-document-context'
import { formatDocumentDate, shiftDate } from '@/lib/benefit-documents'
import type { DocumentGuide, DocumentOptions } from '@/lib/benefit-documents'
import { cn } from '@/lib/utils'

export function DocumentField({ title, name, children, className }: {
  title: string
  name: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('min-w-0 space-y-2', className)}>
      <Label htmlFor={name} className="leading-snug">{title}</Label>
      {children}
    </div>
  )
}

function downloadDraft(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function ApplicationDraft({
  benefit, leave, documents, options, period,
}: {
  benefit: BenefitCode
  leave: NonNullable<DocumentGuide['leave']>
  documents: DocumentGuide['documents']
  options: DocumentOptions
  period?: DateRange
}) {
  const [start, setStart] = useState(period?.start ?? '')
  const [draft, setDraft] = useState('')
  const beforeBirth = benefit === 'macierzynski' && options.maternityCase === 'before_birth'
  const takesOver = benefit === 'macierzynski' && options.maternityCase === 'takeover'
  const parental = benefit === 'rodzicielski'
  const paternity = benefit === 'ojcowski'
  const supplementary = benefit === 'uzupelniajacy'
  const showChildren = !beforeBirth && isFamilyBenefit(benefit)

  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const get = (name: string) => String(data.get(name) ?? '').trim()
    const applicant = get('draft-name')
    const recipient = get('draft-addressee')
    if (!applicant || !recipient) return
    const children = get('draft-children')
    const notes = get('draft-notes')
    const end = get('draft-end')
    const dates = end ? [start, end].map(formatDocumentDate).join(' – ') : 'od ' + formatDocumentDate(start)
    const maternityEnd = get('draft-maternity-end')
    const lines = [
      'SZKIC WNIOSKU URLOPOWEGO',
      '',
      'Wnioskodawca: ' + applicant,
      'Adresat: ' + recipient,
      '',
      'Wniosek o ' + leave.title,
      'Proszę o ' + leave.title + ' w okresie ' + dates + '.',
      ...(children ? ['Dane dzieci: ' + children] : []),
      ...(maternityEnd ? ['Koniec macierzyńskiego: ' + formatDocumentDate(maternityEnd)] : []),
      ...(notes ? [notes] : []),
      '',
      'Dokumenty i informacje do sprawdzenia przed złożeniem:',
      ...documents.map((item) => '• ' + item),
      '',
      'Data i podpis: ........................................',
    ]
    setDraft(lines.join('\n'))
  }

  return (
    <div className="space-y-4 border-t pt-4">
      <p className="text-sm text-muted-foreground">
        Wypełnij pola i pobierz szkic dla pracodawcy. Dodaj załączniki z listy przed złożeniem.
      </p>
      <form className="space-y-4" onSubmit={prepare} onChange={() => setDraft('')}>
        <div className="grid gap-3 sm:grid-cols-2">
          <DocumentField name="draft-name" title="Imię i nazwisko wnioskodawcy">
            <Input name="draft-name" id="draft-name" required pattern=".*\S.*" maxLength={120} autoComplete="off" />
          </DocumentField>
          <DocumentField name="draft-addressee" title="Adresat">
            <Input name="draft-addressee" id="draft-addressee" required pattern=".*\S.*" maxLength={180} />
          </DocumentField>
          <DocumentField name="draft-start" title="Pierwszy dzień okresu">
            <Input name="draft-start" id="draft-start" type="date" required min="1900-01-01" max="2199-12-31" value={start}
              onChange={(event) => setStart(event.target.value)} />
          </DocumentField>
          {!beforeBirth && (
            <DocumentField name="draft-end" title="Ostatni dzień okresu">
              <Input name="draft-end" id="draft-end" type="date" required min={start || '1900-01-01'} max="2199-12-31" defaultValue={period?.end} />
            </DocumentField>
          )}
          {supplementary && (
            <DocumentField name="draft-maternity-end" title="Ostatni dzień macierzyńskiego">
              <Input name="draft-maternity-end" id="draft-maternity-end" type="date" required min="1900-01-01" max="2199-12-31"
                defaultValue={period ? shiftDate(period.start, -1) : undefined} />
            </DocumentField>
          )}
        </div>
        {showChildren && (
          <DocumentField name="draft-children" title="Dane dzieci (imię, nazwisko i data urodzenia)">
            <Input name="draft-children" id="draft-children" required={benefit === 'macierzynski'}
              maxLength={1500} autoComplete="off" />
          </DocumentField>
        )}
        {(parental || takesOver || paternity || supplementary) && (
          <DocumentField name="draft-notes" title={
            parental ? 'Wykorzystane okresy, liczba części i plany drugiego rodzica'
              : takesOver ? 'Okres macierzyńskiego lub zasiłku wykorzystany przed porodem'
                : paternity ? 'Informacja o wcześniej wykorzystanym ojcowskim'
                  : 'Oświadczenie o zamiarach drugiego rodzica'
          }>
            <Input name="draft-notes" id="draft-notes" required maxLength={1500} />
          </DocumentField>
        )}
        <Button type="submit">Przygotuj podgląd</Button>
      </form>

      {draft && (
        <div className="space-y-3">
          <Label htmlFor="draft-preview">Podgląd szkicu</Label>
          <textarea id="draft-preview" rows={11} readOnly value={draft}
            className="w-full rounded-md border border-input bg-background p-3 text-sm leading-relaxed" />
          <Button type="button" variant="outline" onClick={() => downloadDraft(
            'wniosek-urlopowy-' + benefit + '.txt', draft,
          )}>
            <FileDown aria-hidden="true" /> Pobierz szkic
          </Button>
        </div>
      )}
    </div>
  )
}
